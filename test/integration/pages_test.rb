require "test_helper"

class PagesTest < ActionDispatch::IntegrationTest
  setup { @content = SiteContent.default }

  test "home renders the default copy from db/content.json" do
    get root_path

    assert_response :success
    assert_select "title", @content["meta"]["title"]
    assert_select "h1 [data-cms='hero.titleLead']", @content["hero"]["titleLead"]
    assert_select "[data-cms-list='framework.steps'] > .fw-tab", @content["framework"]["steps"].size
    assert_select "[data-cms-list='faq.items'] > details", @content["faq"]["items"].size
    assert_select "script#default-content", 1
  end

  test "home embeds the defaults as JSON for the client-side CMS overlay" do
    get root_path

    json = css_select("script#default-content").first.text
    assert_equal @content.data, JSON.parse(json)
  end

  test "every CMS list ships a blank template for client-side re-rendering" do
    get root_path

    css_select("[data-cms-list]").each do |list|
      assert list.at_css("> template"), "#{list["data-cms-list"]} is missing its <template>"
    end
  end

  test "whatsapp links use the configured number" do
    get root_path

    assert_select "a[data-wa-link][href='https://wa.me/#{@content["contact"]["whatsapp"]}']"
  end

  test "admin login offers the demo autofill with the demo credentials" do
    get admin_login_path

    assert_response :success
    assert_select "button.demo-btn", /Login as admin/
    assert_select "[data-controller='login'][data-login-username-value='admin'][data-login-password-value='rakit2026']"
  end

  test "admin dashboard renders the CMS shell with a live preview" do
    get admin_root_path

    assert_response :success
    assert_select "[data-controller='cms']"
    assert_select "iframe[src='/?preview=1']"
    assert_select "script#default-content", 1
  end
end
