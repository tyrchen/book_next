MDOC=mdoc
TRANSFORM=tools/transform.js
GEN_SUMMARY=tools/gen_summary.js
GEN_TOC=tools/gen_toc.js
FILTER_KEYWORD=tools/filter_keyword.js

VERSION=$(strip $(shell cat version))
OUTPUT=output
SRC=src
RES=resources
SRC_DIRS=$(basename $(shell find src -maxdepth 1 -mindepth 1 -type d))
RES_DIRS=$(basename $(shell find resources -maxdepth 1 -mindepth 1 -type d))
DOCS=$(shell find src -name "*.md" | sort)
PUB_DOCS=$(shell find src -name "*-pub.md" | sort)
RDOCS=$(DOCS:$(SRC)/%.md=$(OUTPUT)/%.md)
PUB_RDOCS=$(PUB_DOCS:$(SRC)/%.md=$(OUTPUT)/%.md)
RES_DOCS=$(shell find resources -name "*.md" | sort)
OUTPUT_DIRS=$(SRC_DIRS:$(SRC)/%=$(OUTPUT)/%) $(RES_DIRS:$(RES)/%=$(OUTPUT)/%)
HTMLS=$(RDOCS:%.md=%.html)
RESOURCES=$(RES_DOCS:$(RES)/%.md=$(OUTPUT)/%.html)
BOOK_HTML=$(OUTPUT)/book.html
RELEASE_FILENAME=tchen

all: build
	@KEYWORD=技术 make post-build
	@mv output/tchen.pdf output/programmer_life_tech.pdf
	@mv output/tchen.epub output/programmer_life_tech.epub
	@KEYWORD=成长 make post-build
	@mv output/tchen.pdf output/programmer_life_growth.pdf
	@mv output/tchen.epub output/programmer_life_growth.epub
	@KEYWORD=杂谈 make post-build
	@mv output/tchen.pdf output/programmer_life_misc.pdf
	@mv output/tchen.epub output/programmer_life_misc.epub

init: install dep
	@echo "Initializing the repo..."

travis-init:
	@echo "Initialize software required for travis (normally ubuntu software)"

show:
	@echo $(PUB_RDOCS)

install:
	@echo "Install software required for this repo..."
	@npm install -g chrome-headless-render-pdf

dep:
	@echo "Install dependencies required for this repo..."
	@yarn

pre-build: dep
	@echo "Running scripts before the build..."

post-build:
	@echo "Running scripts after the build is done..."
	@rm -f $(BOOK_HTML)
	@make pdf
	@make epub

travis: all

travis-deploy:
	@echo "Deploy the software by travis"
	@make release

build: $(OUTPUT) copy-assets gen-summary $(RDOCS) $(HTMLS) $(RESOURCES)

clean:
	@rm -rf $(OUTPUT)/*/*/*.html $(OUTPUT)/intro.html $(OUTPUT)/book.html

copy-assets:
	@rsync -arv $(SRC)/* $(RES)/* $(OUTPUT) --exclude '*.md'

$(OUTPUT): $(OUTPUT_DIRS)

$(OUTPUT_DIRS):
	mkdir -p $@

watch:
	@echo "Watching templates and slides changes..."
	@fswatch -o $(SRC)/ $(RES)/ templates/*/* | xargs -n1 -I{} make build

pdf: $(BOOK_HTML)
	@chrome-headless-render-pdf --window-size 1600x1200 --include-background --url file://$(PWD)/$(BOOK_HTML) --pdf $(OUTPUT)/$(RELEASE_FILENAME).pdf

epub: $(BOOK_HTML)
	@cd $(OUTPUT); pandoc --mathjax book.html -o $(RELEASE_FILENAME).epub

run:
	@http-server $(OUTPUT) -p 8000 -c-1

$(BOOK_HTML):$(PUB_RDOCS)
	@$(eval FILTERED_DOCS := $(shell $(FILTER_KEYWORD) -f "$(KEYWORD)" $(PUB_DOCS)))
	@$(GEN_TOC) -o src/1-summary-pub.md $(FILTERED_DOCS)
	@$(MDOC) src/0-intro-pub.md src/1-summary-pub.md $(FILTERED_DOCS) -o $(BOOK_HTML)

$(DIRECTORIES):$(OUTPUT)/%:$(SRC)

$(RDOCS):$(OUTPUT)/%.md:$(SRC)/%.md
	@echo "Creating revised doc $@ with file $<."
	@$(TRANSFORM) -i $< -o $@

$(HTMLS):$(OUTPUT)/%.html:$(SRC)/%.md
	@echo "Creating doc $@ with file $<."
	-@$(MDOC) $< -o $@

$(RESOURCES):$(OUTPUT)/%.html:$(RES)/%.md
	@echo "Creating doc $@ with file $<."
	-@$(MDOC) $< -o $@

gen-summary: $(PUB_DOCS)
	@echo "Creating summary page"
	@$(GEN_SUMMARY) -o src/1-summary.md $(PUB_DOCS)

filter: $(PUB_DOCS)
	@$(FILTER_KEYWORD) -f "技术" $(PUB_DOCS)

create-week:
	@mkdir -p src/$(shell date +%Y)/w$(shell date +%V)/assets

include .makefiles/*.mk

.PHONY: build copy-assets watch run mv
