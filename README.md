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
              uses: actions/checkout@v3
            - name: Build and push
              uses: alexthemaster/action-build-typescript@v. # check the releases tab on the right for versions (looks like this: v1.0.0)
              # use this if you want the sharpest of cutting edges (can and probably WILL break from time to time)
              # uses: alexthemaster/action-build-typescript@master
              with:
                pushToBranch: true # optional; can either be true or false | defaults to false
                branch: 'dist' # optional; the name of the branch the action should push the compiled code to | defaults to dist
                githubToken: ${{ secrets.GITHUB_TOKEN }} # required if you use the pushToBranch option
```