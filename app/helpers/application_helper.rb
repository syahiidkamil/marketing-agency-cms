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
