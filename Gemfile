source "https://rubygems.org"

ruby "~> 3.3.0"

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
# Rails 8.0, not 8.1: Vercel's build image runs Ruby 3.3.0, which rejects the
# anonymous block arguments Rails 8.1 uses (a Ruby bug fixed in 3.3.1).
gem "rails", "~> 8.0.5", ">= 8.0.5.1"
# The modern asset pipeline for Rails [https://github.com/rails/propshaft]
gem "propshaft"
# Use the Puma web server [https://github.com/puma/puma]
gem "puma", ">= 5.0"
# Use JavaScript with ESM import maps [https://github.com/rails/importmap-rails]
gem "importmap-rails"

# Use Active Model has_secure_password [https://guides.rubyonrails.org/active_model_basics.html#securepassword]
# gem "bcrypt", "~> 3.1.7"

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem "tzinfo-data", platforms: %i[ windows jruby ]

# Reduces boot times through caching; required in config/boot.rb
gem "bootsnap", require: false

group :development, :test do
  # See https://guides.rubyonrails.org/debugging_rails_applications.html#debugging-with-the-debug-gem
  gem "debug", platforms: %i[ mri windows ], require: "debug/prelude"
end

gem "stimulus-rails", "~> 1.3"
