import _ from 'lodash';
import * as core from '@actions/core';
import * as yaml from 'js-yaml';
import { Client } from './types';
import { Config } from './handler';

const weekdayMap = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
}

export function getUnavailableUsers(
  availabilityExceptions: { [key: string]: string[] }
): string[] {
  const d = new Date();
  const day = d.getDay()
  const dayOfWeek = weekdayMap[day];

  const unavailableUsers = availabilityExceptions[dayOfWeek];

  core.info(`Unavailable users for ${dayOfWeek}: ${unavailableUsers}`);

  return unavailableUsers;
}

export function chooseReviewers(
  owner: string, config: Config, unavailableUsers: string[]
): string[] {
  const {
    useReviewGroups,
    reviewGroups,
    numberOfReviewers,
    reviewers
  } = config;

  const useGroups: boolean = useReviewGroups && Object.keys(reviewGroups).length > 0;

  let chosenReviewers: string[] = [];

  if (useGroups) {
    chosenReviewers = chooseUsersFromGroups(
      owner,
      reviewGroups,
      numberOfReviewers,
      unavailableUsers
    );
  } else {
    chosenReviewers = chooseUsers(
      reviewers,
      numberOfReviewers,
      owner,
      unavailableUsers
    );
  }

  return chosenReviewers;
}

export function chooseAssignees(
  owner: string, config: Config, unavailableUsers: string[]
): string[] {
  const {
    useAssigneeGroups,
    assigneeGroups,
    addAssignees,
    numberOfAssignees,
    numberOfReviewers,
    assignees,
    reviewers
  } = config;

  const useGroups: boolean = useAssigneeGroups && Object.keys(assigneeGroups).length > 0;

  let chosenAssignees: string[] = [];

  if (typeof addAssignees === 'string') {
    if (addAssignees !== 'author') {
      throw new Error(
        "Error in configuration file to do with using addAssignees. Expected 'addAssignees' variable to be either boolean or 'author'"
      );
    }
    chosenAssignees = [owner];
  } else if (useGroups) {
    chosenAssignees = chooseUsersFromGroups(
      owner,
      assigneeGroups,
      numberOfAssignees || numberOfReviewers,
      unavailableUsers
    );
  } else {
    const candidates = assignees ? assignees : reviewers;
    chosenAssignees = chooseUsers(
      candidates,
      numberOfAssignees || numberOfReviewers,
      owner,
      unavailableUsers
    );
  }

  return chosenAssignees;
}

export function chooseUsers(
  candidates: string[],
  desiredNumber: number,
  filterUser: string = '',
  unavailableUsers: string[]
): string[] {
  const filteredCandidates = candidates.filter((reviewer: string): boolean => {
    return reviewer !== filterUser && !unavailableUsers.includes(reviewer);
  });

  // all-assign
  if (desiredNumber === 0) {
    return filteredCandidates;
  }

  return _.sampleSize(filteredCandidates, desiredNumber);
}

export function includesSkipKeywords(
  title: string,
  skipKeywords: string[]
): boolean {
  for (const skipKeyword of skipKeywords) {
    if (title.toLowerCase().includes(skipKeyword.toLowerCase()) === true) {
      return true;
    }
  }

  return false;
}

export function chooseUsersFromGroups(
  owner: string,
  groups: { [key: string]: string[] } | undefined,
  desiredNumber: number,
  unavailableUsers: string[]
): string[] {
  let users: string[] = [];

  for (const group in groups) {
    users = users.concat(chooseUsers(groups[group], desiredNumber, owner, unavailableUsers));
  }

  return users;
}

export async function fetchConfigurationFile(client: Client, options) {
  const { owner, repo, path, ref } = options;
  const result = await client.rest.repos.getContent({
    owner,
    repo,
    path,
    ref,
  });

  const data: any = result.data;

  if (!data.content) {
    throw new Error('the configuration file is not found');
  }

  const configString = Buffer.from(data.content, 'base64').toString();
  const config = yaml.load(configString);

  return config;
}
