import { Layout, Text, Code, Page, Link } from "@vercel/examples-ui";

export default function Home({ data }: { data: any }) {
  return (
    <Page>
      <h1>Build for Each Other</h1>
      <p>Build for each other, and promote your peers using rocket PRs.</p>
      <p>
        Every week, this will post a report of the previous week's PRs merged
        with a 🚀 reaction from at least one colleague.
      </p>
    </Page>
  );
}

Home.Layout = Layout;
