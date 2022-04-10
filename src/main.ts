import * as core from '@actions/core';
import * as github from '@actions/github';
// import * as utils from './utils';
// import * as handler from './handler';

export async function run() {
  try {
    const owner = core.getInput('owner', { required: true });
    const repo = core.getInput('repo', { required: true });
    const pr_number = parseInt(core.getInput('pr_number', { required: true }));
    const token = core.getInput('token', { required: true });
    // const token = core.getInput('repo-token', { required: true });
    // const configPath = core.getInput('configuration-path', {
    //   required: true,
    // });

    const octokit = github.getOctokit(token);
    // const { repo, sha } = github.context;
    // const config = await utils.fetchConfigurationFile(client, {
    //   owner: repo.owner,
    //   repo: repo.repo,
    //   path: configPath,
    //   ref: sha,
    // });

    // await handler.handlePullRequest(client, github.context, config);

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pr_number,
      body: `
        Hello world :wave:
      `
    });
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}
