# Every route here is exported to dist/<path>/index.html by `rake static:export`,
# so keep them GET-only and free of per-request state.
Rails.application.routes.draw do
  root "pages#home"

  namespace :admin do
    get "login", to: "sessions#new"
    root "dashboard#show"
  end
end
