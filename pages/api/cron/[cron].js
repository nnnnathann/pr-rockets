import { NextResponse } from "next/server";
import { Octokit, App } from "octokit";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  const cron = req.nextUrl.searchParams.get("cron");
  if (!cron) return new Response("No cron provided", { status: 400 });
  const response = await prRockets({
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
    GITHUB_OWNER: process.env.GITHUB_OWNER,
    GITHUB_REPO: process.env.GITHUB_REPO,
  });
  return new NextResponse(JSON.stringify(response), {
    status: 200,
  });
}

async function prRockets({
  GITHUB_TOKEN,
  SLACK_WEBHOOK_URL,
  GITHUB_OWNER,
  GITHUB_REPO,
}) {
  const prsWithRocket = await getPullRequestsWithRocketEmoji(
    GITHUB_TOKEN,
    GITHUB_OWNER,
    GITHUB_REPO
  );

  if (prsWithRocket.length === 0) {
    await sendToSlack(
      SLACK_WEBHOOK_URL,
      ":warning: none of this week's PRs were rocketed!"
    );
    return { ok: true };
  }

  const authorCounts = {};
  for (const pr of prsWithRocket) {
    const author = pr.user.login;
    if (!authorCounts[author]) {
      authorCounts[author] = 0;
    }
    authorCounts[author]++;
  }

  let message = "well done to these authors of merged rocket PRs! :clap:\n";
  for (const [author, count] of Object.entries(authorCounts)) {
    message += `${author}: ${count}\n`;
  }

  await sendToSlack(SLACK_WEBHOOK_URL, message);
  console.log("results sent to Slack");
  return { ok: true };
}

async function getPullRequestsWithRocketEmoji(token, owner, repo) {
  const octokit = new Octokit({ auth: token });
  const pulls = await octokit.rest.pulls.list({
    sort: "updated",
    direction: "desc",
    state: "closed",
    owner,
    repo,
    per_page: 100,
  });
  const oneWeekAgo = new Date(
    Date.now() - 60 * 60 * 24 * 7 * 1000
  ).toISOString();

  const pullRequestsWithRocket = [];
  for (const pr of pulls.data) {
    if (pr.merged_at < oneWeekAgo) {
      continue;
    }
    const prNumber = pr.number;
    const reactions = await octokit.rest.reactions.listForIssue({
      issue_number: prNumber,
      owner,
      repo,
    });

    for (const reaction of reactions.data) {
      if (
        reaction.content === "rocket" &&
        reaction.user.login !== pr.user.login
      ) {
        pullRequestsWithRocket.push(pr);
        break;
      }
    }
  }

  return pullRequestsWithRocket;
}

async function sendToSlack(webhookUrl, message) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook error: ${response.statusText}`);
  }
}
