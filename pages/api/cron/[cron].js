import { NextRequest, NextResponse } from "next/server";

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
    console.log("No rocket emoji kudos for the last 2 weeks");
    process.exit(0);
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
  const oneWeekAgo = new Date(
    Date.now() - 60 * 60 * 24 * 7 * 1000
  ).toISOString();
  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github+json",
  };
  const params = new URLSearchParams({
    state: "all",
    since: oneWeekAgo,
  });
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?${params}`,
    { headers }
  );
  const pullRequests = await response.json();

  const pullRequestsWithRocket = [];
  for (const pr of pullRequests) {
    if (!pr.merged_at) {
      continue;
    }
    const prNumber = pr.number;
    const reactionsHeaders = {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.squirrel-girl-preview+json",
    };
    const reactionsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/reactions`,
      { headers: reactionsHeaders }
    );
    const reactions = await reactionsResponse.json();

    for (const reaction of reactions) {
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
