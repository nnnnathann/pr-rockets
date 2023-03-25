import { Layout, Text, Code, Page, Link } from "@vercel/examples-ui";
import Post from "@/components/post";
import Head from "next/head";

const intervals = [
  {
    id: "1w",
    name: "Every Week",
    cron: "0 0 * * 0",
  },
];

const image = "https://cron-template.vercel.app/thumbnail.png";

export default function Home({ data }: { data: any }) {
  return (
    <Page>
      <Head>
        <meta property="og:image" content={image} />
        <meta name="twitter:image" content={image} />
      </Head>
      <section className="flex flex-col gap-6">
        <Text variant="h1">Vercel Crob Jobs Example</Text>
        <Text>
          This example shows you how you can use{" "}
          <Link
            href="https://vercel.com/docs/cron-jobs"
            target="_blank"
            rel="noreferrer noopener"
          >
            Vercel Cron Jobs
          </Link>{" "}
          to update data at different intervals.
        </Text>
        <Text>
          Each of the following sections are the{" "}
          <Link
            href="https://github.com/HackerNews/API#new-top-and-best-stories"
            target="_blank"
            rel="noreferrer noopener"
          >
            newest stories on Hacker News
          </Link>{" "}
          retrieved at different intervals using{" "}
          <Link
            href="https://vercel.com/docs/cron-jobs"
            target="_blank"
            rel="noreferrer noopener"
          >
            Vercel Cron Jobs
          </Link>{" "}
          and stored in{" "}
          <Link
            href="https://docs.upstash.com/redis"
            target="_blank"
            rel="noreferrer noopener"
          >
            Upstash Redis
          </Link>
          .
        </Text>
      </section>
      <section className="grid gap-6 mt-10 pt-10 border-t border-gray-300">
        <div className="flex flex-col gap-12">
          {intervals.map((interval) => (
            <div key={interval.id} className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <Text variant="h2">{interval.name}</Text>
                <Code>{interval.cron}</Code>
              </div>
              <Post interval={interval.id} />
            </div>
          ))}
        </div>
      </section>
    </Page>
  );
}

Home.Layout = Layout;
