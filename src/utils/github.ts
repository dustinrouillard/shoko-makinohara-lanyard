import { Buffer } from 'node:buffer';

export async function pullLanyardReadme() {
  const readme: { content: string } = await fetch('https://api.github.com/repos/phineas/lanyard/readme', { headers: { 'user-agent': 'dstn.to-shoko-makinohara' } }).then((r) =>
    r.json(),
  );
  const text = Buffer.from(readme.content, 'base64').toString();

  const projectsText = text.split('## Community Projects')[1].split('\n')[2];
  const communityProjectsDown = text.split(projectsText)[1];
  const communityProjects = communityProjectsDown
    .split('##')[0]
    .trim()
    .split('\\')
    .map((item) => {
      const data = item.replace(/\n/g, '').split(' - ');
      return { link: data[0], description: data[1] };
    });

  const websitesText = text.split('## Showcase')[1].split('\n')[2];
  const websitesDown = text.split(websitesText)[1];
  const websites = websitesDown
    .split('##')[0]
    .trim()
    .split('\n')
    .map((item) => item.replace(/[\n|-\s]/g, ''));

  return {
    communityProjects,
    showcase: websites,
  };
}
