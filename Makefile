NAME=focus-mode
DOMAIN=exposedcat

.PHONY: all pack install clean

all: dist/extension.js

node_modules: package.json
	npm install

# dist/prefs.js
dist/extension.js: node_modules
	npx tsc

# schemas/gschemas.compiled: schemas/org.gnome.shell.extensions.$(NAME).gschema.xml
# 	glib-compile-schemas schemas

# dist/prefs.js schemas/gschemas.compiled
#  @cp -r schemas dist/
$(NAME).zip: dist/extension.js 
	@cp metadata.json dist/
	@(cd dist && zip ../$(NAME).zip -9r .)

pack: $(NAME).zip

install: $(NAME).zip
	@touch ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)
	@rm -rf ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)
	@mv dist ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)

clean:
	@rm -rf dist node_modules $(NAME).zip

test:
	@dbus-run-session -- gnome-shell --nested --wayland