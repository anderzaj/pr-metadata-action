// import * as github from '@actions/github';
// import * as yaml from 'js-yaml';

// export async function fetchConfigurationFile(client: github.GitHub, options) {
//   const { owner, repo, path, ref } = options;
//   const result = await client.repos.getContents({
//     owner,
//     repo,
//     path,
//     ref,
//   });

//   const data: any = result.data;

//   if (!data.content) {
//     throw new Error('the configuration file is not found');
//   }

//   const configString = Buffer.from(data.content, 'base64').toString();
//   const config = yaml.load(configString);

//   return config;
// }
