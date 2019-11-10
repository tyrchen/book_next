PANDOC=pandoc --lua-filter templates/pagebreak.lua -t html5 --mathjax --template=templates/github.wechat --tab-stop 2 --highlight-style pygments --standalone --section-divs

VERSION=$(strip $(shell cat version))
OUTPUT=output
SRC=src
RES=resources
SRC_DIRS=$(basename $(shell find src -maxdepth 1 -mindepth 1 -type d))
RES_DIRS=$(basename $(shell find resources -maxdepth 1 -mindepth 1 -type d))
DOCS=$(shell find src -name "*.md")
RES_DOCS=$(shell find resources -name "*.md")
OUTPUT_DIRS=$(SRC_DIRS:$(SRC)/%=$(OUTPUT)/%) $(RES_DIRS:$(RES)/%=$(OUTPUT)/%)
HTMLS=$(DOCS:$(SRC)/%.md=$(OUTPUT)/%.html)
RESOURCES=$(RES_DOCS:$(RES)/%.md=$(OUTPUT)/%.html)
BOOK_HTML=$(OUTPUT)/book.html
RELEASE_FILENAME=tchen

all: build post-build

init: install dep
	@echo "Initializing the repo..."

travis-init:
	@echo "Initialize software required for travis (normally ubuntu software)"

show:
	@echo $(HTMLS) $(RESOURCES) $(SRC_DIRS) $(OUTPUT_DIRS)

install:
	@echo "Install software required for this repo..."
	@brew install pandoc
	@mix local.rebar --force

dep:
	@echo "Install dependencies required for this repo..."
	@npm install -g chrome-headless-render-pdf

pre-build: dep
	@echo "Running scripts before the build..."

post-build:
	@echo "Running scripts after the build is done..."
	@make pdf
	@make epub

travis: all

travis-deploy:
	@echo "Deploy the software by travis"
	@make release

build: $(OUTPUT) copy-assets $(HTMLS) $(RESOURCES)

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

$(BOOK_HTML):$(DOCS)
	@$(PANDOC) $(DOCS) -o $(BOOK_HTML).tmp
	@sed 's/src="\//src="/g' $(BOOK_HTML).tmp > $(BOOK_HTML)

$(DIRECTORIES):$(OUTPUT)/%:$(SRC)

$(HTMLS):$(OUTPUT)/%.html:$(SRC)/%.md
		@echo "Creating doc $@ with file $<."
		-@$(PANDOC) $< -o $@

$(RESOURCES):$(OUTPUT)/%.html:$(RES)/%.md
		@echo "Creating doc $@ with file $<."
		-@$(PANDOC) $< -o $@


include .makefiles/*.mk

.PHONY: build copy-assets watch run mv
