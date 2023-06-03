double f(var a, var b, var c, var d) {
  var e = 0.017453292519943295;
  var g = pow(10, 10);
  var h = ((c - a) * e).abs();
  var i = ((d - b) * e).abs();
  var j = (1 - cos(h)) / 2 + cos(a * e) * cos(c * e) * (1 - cos(i)) / 2;
  return (((asin(sqrt(j / g)) * 12742 * g).round()) / g);
}
