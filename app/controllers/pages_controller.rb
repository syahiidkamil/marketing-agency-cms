class PagesController < ApplicationController
  def home
    @content = SiteContent.default
  end
end
