module Admin
  class DashboardController < ApplicationController
    layout "admin"

    def show
      @content = SiteContent.default
    end
  end
end
