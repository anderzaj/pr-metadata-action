import * as core from '@actions/core';
import * as github from '@actions/github';
import * as utils from './utils';
import * as handler from './handler';

export async function run() {
  try {
    const prNumber = parseInt(core.getInput('pr-number', { required: true }));
    const token = core.getInput('repo-token', { required: true });
    const configPath = core.getInput('configuration-path', {
      required: true,
    });

    const client = github.getOctokit(token);

    const { repo, sha } = github.context

    const config = await utils.fetchConfigurationFile(client, {
      owner: repo.owner,
      repo: repo.repo,
      path: configPath,
      ref: sha,
    }) as handler.Config;

    await handler.handlePullRequest(client, github.context, config);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
