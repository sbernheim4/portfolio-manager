# Welcome to Remix!

- [Remix Docs](https://remix.run/docs)

## Environment Variables
Some environment variables will be needed before this project can be run locally
or in the cloud. This file will need to be `source`d  before starting the server
locally.

1. Create an environment variable file: `touch app/env.sh`, or set them via your
   server's UI.
2. Set the following environment variables:

```sh
export PLAID_ENV=
export PLAID_CLIENT_ID=
export PLAID_SECRET=
export MONGODB_PWD=
```

## Database
This project is set up to use MongoDB though you can swap out the underlying
storage mechanism by updating the functions in `db.server.ts`.

## Deployment

After having run the `create-remix` command and selected "Vercel" as a deployment target, you only need to [import your Git repository](https://vercel.com/new) into Vercel, and it will be deployed.

If you'd like to avoid using a Git repository, you can also deploy the directory by running [Vercel CLI](https://vercel.com/cli):

```sh
npm i -g vercel
vercel
```

It is generally recommended to use a Git repository, because future commits will then automatically be deployed by Vercel, through its [Git Integration](https://vercel.com/docs/concepts/git).

## Development

To run your Remix app locally, make sure your project's local dependencies are installed:

```sh
npm install
```

Afterwards, start the Remix development server like so:

```sh
npm run dev
```

Open up [http://localhost:3000](http://localhost:3000) and you should be ready to go!

If you're used to using the `vercel dev` command provided by [Vercel CLI](https://vercel.com/cli) instead, you can also use that, but it's not needed.
