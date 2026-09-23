module Admin
  class DashboardController < ApplicationController
    layout "admin"

    def show
      @content = SiteContent.default
      @images = Dir[Rails.public_path.join("images/**/*.{svg,png,jpg,jpeg,webp}")].sort.map { |file| "/#{Pathname(file).relative_path_from(Rails.public_path)}" }
    end
  end
end
