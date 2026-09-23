# Default landing-page copy, loaded from db/content.json.
#
# This is the single source of truth for the server-rendered page. The admin CMS
# stores edits in the visitor's localStorage and the browser merges them over
# these defaults (see app/javascript/lib/content_store.js).
class SiteContent
  PATH = Rails.root.join("db/content.json")

  def self.default
    @default = nil if Rails.env.development? # pick up edits to the JSON without a restart
    @default ||= new(JSON.parse(PATH.read))
  end

  attr_reader :data

  def initialize(data)
    @data = data
  end

  def [](key)
    data.fetch(key.to_s)
  end

  def to_json(*)
    data.to_json
  end
end
