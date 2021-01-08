# action-build-typescript
A GitHub action that can be used to build TypeScript code and then push that built code to a different branch

## Usage
```yml
name: Build
on: 
    push: 
        branches:
            - master
jobs:
    build:
        runs-on: ubuntu-latest
        steps: 
            - name: Checkout project
              uses: actions/checkout@v2
            - name: Setup Node.js
              uses: actions/setup-node@v2.1.4
              with:
                node-version: 12
            - name: Build and push
              uses: alexthemaster/action-build-typescript@<check latest release on the right side> # (looks like this: v1.0.0)
              with:
                pushToBranch: true # optional; can either be true or false | defaults to false
                branch: 'dist' # optional; the name of the branch the action should push the compiled code to | defaults to dist
                githubToken: ${{ secrets.GITHUB_TOKEN }} # required if you use the pushToBranch option
```