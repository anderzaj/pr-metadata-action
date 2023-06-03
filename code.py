class SendPostPaymentNotifications(Command):
    required_arguments = ["appointment"]

    def perform(self):
        appointment = self.appointment
        sales_source = appointment.sales_source
        if sales_source == "medilink":
            patient = SimpleNamespace(**appointment.medilink_order.patient_raw_data)
        else:
            patient = appointment.managing_patient_obj()
        nurse_name = appointment.nurse.user.fullname()
        parsed_date = spanish_parse_date(appointment=appointment)
        priced_items_service = AppointmentPricedItemsService(appointment=appointment)
        cart = priced_items_service.get_cart()
        exams_names = ", ".join(priced_items_service.get_names(distinct=False).values())
        paid_price = appointment.payments.filter(status=Payment.PAYMENT_SUCCESSFUL).aggregate(
            total=Sum("amount")
        )["total"]

        same_day = appointment.begin_date.strftime("%m/%d/%y") == pendulum.today(
            "America/Mexico_City"
        ).format("DD/MM/YYYY")
        payment_template = get_template("slack_payment_confirmed")
        payment_message = payment_template.render(
            {
                "appointment": appointment,
                "analytics_url": settings.ANALYTICS_URL,
                "patient": patient,
                "nurse_name": nurse_name,
                "exams": exams_names,
                "paid_price": paid_price,
                "parsed_date": parsed_date,
                "same_day_and_mx": appointment.country_code == MEXICO_EXTENSION and same_day,
            }
        )

        if appointment.sales_source != "laboratoriochopo":
            payment_confirmed_notification(
                message=payment_message, country_code=appointment.country_code
            )

        if is_kine_appointment(appointment):
            kine_payment_confirmed_notification(message=payment_message, appointment=appointment)

        created_at_date = (
            pendulum.instance(appointment.created_at).in_timezone(appointment.safe_timezone).date()
        )
        begin_date_date = pendulum.instance(appointment.begin_date).in_timezone("UTC").date()

        if created_at_date == begin_date_date:
            appointment_same_day_alert(
                message=(f":rotating_light: :rotating_light: :rotating_light: {payment_message}")
            )

        if appointment.referral_events.exists() and (
            "EXATEAM" in appointment.referral_events.first().referrer.referral_code
        ):
            team_coupon_used_notification(message=payment_message)

        if cart["medical_services"].filter(category="kinseiology").exists():
            kinesiology_template = get_template("slack_first_kine_session")
            kinseiology_message = kinesiology_template.render(
                {
                    "patient": appointment.managing_patient_obj(),
                    "kine_services": appointment.service_names,
                    "parsed_date": parsed_date,
                }
            )
            kine_session_request(kinseiology_message)

        if sales_source and sales_source != "marketplace":
            widget_appointment_confirmed(
                message=f"{payment_message}\n\t*Source*: {sales_source}",
                source=sales_source,
                country_code=appointment.country_code,
            )

        if appointment.nurse.fake:
            fake_nurse_template = get_template("fake_nurse_notif")
            fake_nurse_message = fake_nurse_template.render(
                {
                    "appt_id": str(appointment.id),
                    "url": f"{settings.ANALYTICS_URL}/appointment/{str(appointment)}",
                    "date": parsed_date,
                    "address": appointment.target_address,
                }
            )
            fake_nurse_appointment(fake_nurse_message)
