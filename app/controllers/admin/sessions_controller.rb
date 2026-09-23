module Admin
  # Login page. Authentication happens in the browser (login_controller.js)
  # because the deployed site is static: this is a portfolio demo, not real auth.
  class SessionsController < ApplicationController
    DEMO_USERNAME = "admin"
    DEMO_PASSWORD = "rakit2026"

    layout "admin"

    def new
    end
  end
end
