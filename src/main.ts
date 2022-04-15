import * as core from '@actions/core';
import * as github from '@actions/github';
import * as utils from './utils';
import * as handler from './handler';

export async function run() {
  try {
    const owner = core.getInput('owner', { required: true });
    // const repo = core.getInput('repo', { required: true });
    const prNumber = parseInt(core.getInput('pr-number', { required: true }));
    const token = core.getInput('token', { required: true });
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
    });

    const {
      skipKeywords,
      useReviewGroups,
      useAssigneeGroups,
      reviewGroups,
      assigneeGroups,
      addReviewers,
      addAssignees,
      filterLabels,
      runOnDraft,
    } = config as handler.Config;

    // await handler.handlePullRequest(client, github.context, config);

    await client.rest.issues.createComment({
      owner,
      repo: repo.repo,
      issue_number: prNumber,
      body: `
        Hello world :wave:
        ${skipKeywords}
        ${useReviewGroups}
        ${useAssigneeGroups}
        ${reviewGroups}
        ${assigneeGroups}
        ${addReviewers}
        ${addAssignees}
        ${filterLabels}
        ${runOnDraft}
        ${repo.owner}
        ${owner}
      `
    });
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
