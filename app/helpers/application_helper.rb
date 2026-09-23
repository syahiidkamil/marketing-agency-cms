module ApplicationHelper
  # Text bound to a content path, e.g. cms_text(:h1, "hero.titleLead").
  # content_controller.js swaps in the visitor's saved edit via textContent.
  def cms_text(tag, path, options = {})
    value = path.split(".").reduce(@content.data) { |node, key| node.fetch(key) }
    content_tag(tag, value, options.merge(data: (options[:data] || {}).merge(cms: path)))
  end

  # A repeatable list bound to a content path. The block renders one item and is
  # also captured once with blank values into a <template>, which the browser
  # clones when the list is re-rendered from saved edits.
  #
  #   <%= cms_list :ul, "comparison.old", class: "vs-list" do |item| %>
  #     <li><%= cms_field :span, "text", item %></li>
  #   <% end %>
  def cms_list(tag, path, options = {}, &block)
    items = path.split(".").reduce(@content.data) { |node, key| node.fetch(key) }
    blank = blank_like(items.first)
    content_tag(tag, options.merge(data: (options[:data] || {}).merge(cms_list: path))) do
      safe_join([ content_tag(:template, capture(blank, &block)), *items.map { |item| capture(item, &block) } ])
    end
  end

  # A field of the current list item. Use "." when the item itself is the value.
  def cms_field(tag, field, item, options = {})
    value = field == "." ? item : item[field]
    content_tag(tag, value, options.merge(data: (options[:data] || {}).merge(cms_field: field)))
  end

  # An image of the current list item: src from `field`, alt from `alt_field`
  # (or empty for decorative images). Re-bound by content_controller.js.
  def cms_image(field, item, alt_field: nil, **options)
    data = (options.delete(:data) || {}).merge(cms_src: field)
    data[:cms_alt] = alt_field if alt_field
    tag.img(src: item[field].presence, alt: alt_field ? item[alt_field] : "", decoding: "async", data: data, **options)
  end

  # Initials avatar for a name ("Dimas Pratama" → "DP"). Pass `path:` for a
  # top-level content path, or `field:` + `item` inside a cms_list block.
  def cms_initials(item = nil, field: nil, path: nil, **options)
    name = path ? path.split(".").reduce(@content.data) { |node, key| node.fetch(key) } : item[field]
    data = (options.delete(:data) || {}).merge(path ? { cms_initials: path } : { cms_field_initials: field })
    content_tag(:span, initials(name), options.merge(data: data, aria: { hidden: true }))
  end

  def initials(name)
    name.to_s.split("·").first.to_s.split.first(2).map { |word| word[0] }.join.upcase
  end

  # Absolute URL for share tags. Vercel exposes the production domain at build
  # time; SITE_URL overrides it. Falls back to a root-relative path locally.
  def absolute_url(path)
    host = ENV["SITE_URL"].presence || ENV["VERCEL_PROJECT_PRODUCTION_URL"].presence&.then { |domain| "https://#{domain}" }
    host ? URI.join(host, path).to_s : path
  end

  def whatsapp_url(text = nil)
    url = "https://wa.me/#{@content["contact"]["whatsapp"]}"
    text ? "#{url}?text=#{ERB::Util.url_encode(text)}" : url
  end

  private

  def blank_like(value)
    case value
    when Hash then value.transform_values { |v| blank_like(v) }
    when Array then []
    when Numeric then 0
    else ""
    end
  end
end
