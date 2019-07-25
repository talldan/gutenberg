#!/bin/bash
set -e

# 1. Get the URL for the pull request.

url=$(jq -r '.pull_request.html_url' $GITHUB_EVENT_PATH)

# 2. Curl the URL to get the page html.

html=$(curl $url)

# 3. Run a regular expression against the html to check for the First Time Contributor element.

if ! [[ $html =~ '\<span class="timeline-comment-label.*\>\s*First-time contributor\s*\<\/span\>' ]]; then
	echo "Pull request was not created by a first-time contributor."
	exit 78
else

# 4. Assign the 'First Time Contributor' label.

curl \
	--silent \
	-X POST \
	-H "Authorization: token $GITHUB_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"labels":["First-time Contributor"]}' \
	"https://api.github.com/repos/$GITHUB_REPOSITORY/issues/$issue/labels" > /dev/null
