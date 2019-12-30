RELEASE_VERSION=v$(VERSION)
GIT_BRANCH=$(strip $(shell git symbolic-ref --short HEAD))
GIT_VERSION="$(strip $(shell git rev-parse --short HEAD))"
RELEASE_BODY=[release note](https://github.com/tyrchen/book_next/blob/$(RELEASE_VERSION)/CHANGELOG.md#$(VERSION)-$(shell date +%B-%d-%Y | tr "[:upper:]" "[:lower:]")
RELEASE_DATA='{"tag_name": "$(RELEASE_VERSION)", "name": "$(RELEASE_VERSION)", "target_commitish": "master", "body": "$(RELEASE_BODY))"}'
RELEASE_URL=https://api.github.com/repos/tyrchen/book_next/releases

info:
	@echo $(RELEASE_DATA)

release: all
	@git config --local user.name "Tyr Chen"
	@git config --local user.email "tyr.chen@gmail.com"
	@git tag -a $(RELEASE_VERSION) -m "Release $(RELEASE_VERSION). Revision is: $(GIT_VERSION)" || true
	@git push origin $(RELEASE_VERSION) || true
	@curl -s -d $(RELEASE_DATA) "$(RELEASE_URL)?access_token=$(GITHUB_TOKEN)" || true
	@.makefiles/upload_asset.sh tag=$(RELEASE_VERSION) filename=$(OUTPUT)/programmer_life_tech.pdf || true
	@.makefiles/upload_asset.sh tag=$(RELEASE_VERSION) filename=$(OUTPUT)/programmer_life_growth.pdf || true
	@.makefiles/upload_asset.sh tag=$(RELEASE_VERSION) filename=$(OUTPUT)/programmer_life_misc.pdf || true
	@.makefiles/upload_asset.sh tag=$(RELEASE_VERSION) filename=$(OUTPUT)/programmer_life_tech.epub || true
	@.makefiles/upload_asset.sh tag=$(RELEASE_VERSION) filename=$(OUTPUT)/programmer_life_growth.epub || true
	@.makefiles/upload_asset.sh tag=$(RELEASE_VERSION) filename=$(OUTPUT)/programmer_life_misc.epub || true

delete-release:
	@echo "Delete a release on $(RELEASE_VERSION)"
	@git tag -d $(RELEASE_VERSION) || true
	@git push -f -d origin $(RELEASE_VERSION) || true

bump-version:
	@echo "Bump version..."
	@.makefiles/bump_version.sh

create-pr:
	@echo "Creating pull request..."
	@make bump-version || true
	@git add CHANGELOG.md version;git commit -m "bump version" -n;git push origin $(GIT_BRANCH)
	@hub pull-request

browse-pr:
	@hub browse -- pulls
