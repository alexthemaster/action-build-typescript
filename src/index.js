const core = require('@actions/core');
const github = require('@actions/github');
const io = require('@actions/io');
const { exec } = require('@actions/exec');
const { access } = require('fs').promises;
const { join } = require('path');

// Inputs
const pushToBranch = Boolean(core.getInput('pushToBranch'));
const branchName = core.getInput('branch');
let author = core.getInput('author');
const githubToken = core.getInput('githubToken');
const directory = process.env.GITHUB_WORKSPACE;

// Checks
if (pushToBranch) {
    if (typeof branchName !== 'string') return exit('The branch input is supposed to be a string (example: "dist")');
    if ((author && typeof author !== 'string') || !author) author = github.context.actor;
    if (!githubToken || typeof githubToken !== 'string') return exit('A GitHub secret token is a required input for pushing code (hint: use ${{ secrets.GITHUB_TOKEN }} )');
}

(async () => {
    const tsconfigPath = join(directory, 'tsconfig.json');

    try {
        await access(tsconfigPath);

        const tsconfig = require(tsconfigPath);
        const outDir = tsconfig.compilerOptions.outDir ? tsconfig.compilerOptions.outDir : directory;
        // Install TSC
        await exec('npm i --g typescript');
        // Install dependencies
        await exec(`npm ci`, [], { cwd: directory });
        // Build project
        const build = await exec(`tsc`, [], { cwd: directory });
        if (build !== 0) return exit('Something went wrong while building.');
        if (!pushToBranch) return process.exit(0);

        const octokit = github.getOctokit(githubToken);

        const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
        const branches = await octokit.repos.listBranches({
            owner,
            repo
        });

        const branchExists = branches.data.some(branch => branch.name.toLowerCase() === branchName);
        // Set up Git user
        await exec(`git config --global user.name ${author}`);
        await exec(`git config --global user.email action@github.com`);
        const clone = await exec(`git clone https://${github.context.actor}:${githubToken}@github.com/${owner}/${repo}.git branch-${branchName}`);
        // Check out to branch
        await exec(`${branchExists ? `git checkout ${branchName}` : `git checkout --orphan ${branchName}`}`, [], { cwd: `branch-${branchName}` });
        if (clone !== 0) return exit('Something went wrong while cloning the repository.');

        // Copy compiled files and package* files
        await io.cp(join(directory, outDir), `branch-${branchName}`, { recursive: true });
        await io.cp(join(directory, 'package.json'), `branch-${branchName}`);
        await io.cp(join(directory, 'package-lock.json'), `branch-${branchName}`);

        // Commit files
        await exec(`git add ."`, [], { cwd: `branch-${branchName}` });
        await exec(`git commit -m "build: ${github.context.sha}"`, [], { cwd: `branch-${branchName}` });
        // Push files
        await exec(`git push origin HEAD:${branchName}`, [], { cwd: `branch-${branchName}` });
        process.exit(0);
    } catch (error) {
        exit(`Something went wrong: ${error}`);
    }
})();

function exit(error) {
    core.setFailed(error);
    process.exit();
}