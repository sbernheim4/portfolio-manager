# Welcome to Portfolio Manager!

This is a [Remix based application](https://remix.run/docs)

## Before Running the App
### Install Dependencies

```sh
npm install
```

### Environment Variables
Some environment variables are necessary before this project can be run locally
or in the cloud.

#### Local Environment Variables Setup

For local development create an env.sh file, add the needed environment
variables, and mark the file as executable.

```sh
touch app/env.sh && \
echo "export PLAID_ENV=\nexport PLAID_CLIENT_ID=\nexport PLAID_SECRET=\nexport MONGODB_PWD=" > app/env.sh && \
chmod +x app/env.sh
```

Before running `npm run dev`, be sure to source the environment variables:

```sh
source app/env.sh
```

> Be sure to update `app/env.sh` to set the environment variables to their values.

For cloud deployment set environment variables however your cloud provider
allows you to. The above environment variables (listed below again for
convenience) are required and should be retrieved from your Plaid account and
MongoDB account.

* `PLAID_ENV`
* `PLAID_CLIENT_ID`
* `PLAID_SECRET`
* `MONGODB_PWD`

## Running the App

Afterwards, start the Remix development server like so:

```sh
npm run dev
```

To compile SASS files to CSS run:

```sh
npm run sass
```

Open up [http://localhost:3000](http://localhost:3000) and you should be ready to go!

## Database

This project is set up to use MongoDB though you can swap out the underlying
storage mechanism by updating the functions in `db.server.ts`. Note additional
environment variables may be needed.

## Cloud Deployment
This project is set up for deploymnet on Vercel though you can use any cloud
provider though you may need to make some modifications. You can always generate
a new Remix project copying the `app` folder into the newly created project
along with the `package.json`.

For vercel deployment run
```sh
npm i -g vercel
vercel
```
It is generally recommended to use a Git repository, because future commits will
then automatically be deployed by Vercel, through its [Git
Integration](https://vercel.com/docs/concepts/git).
