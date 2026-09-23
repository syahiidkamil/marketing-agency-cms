# The site is exported to static HTML (see lib/tasks/static.rake), so controllers
# only render templates: no sessions, cookies, or browser gating.
class ApplicationController < ActionController::Base
  # Changes to the importmap will invalidate the etag for HTML responses
  stale_when_importmap_changes
end
