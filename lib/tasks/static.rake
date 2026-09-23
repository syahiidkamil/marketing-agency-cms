# Exports the site as static HTML for Vercel (which can't run a Rails server).
#
#   RAILS_ENV=production SECRET_KEY_BASE_DUMMY=1 bin/rails static:export
#
# Renders every route through the Rack app, writes dist/<path>/index.html,
# and copies public/ (including the precompiled, digested assets) alongside.
namespace :static do
  STATIC_ROUTES = %w[/ /admin/login /admin].freeze

  desc "Render the site to dist/ as static HTML"
  task export: :environment do
    abort "static:export must run with RAILS_ENV=production" unless Rails.env.production?

    Rake::Task["assets:precompile"].invoke

    dist = Rails.root.join("dist")
    FileUtils.rm_rf(dist)
    FileUtils.mkdir_p(dist)
    FileUtils.cp_r("#{Rails.public_path}/.", dist)

    session = Rack::MockRequest.new(Rails.application)
    STATIC_ROUTES.each do |path|
      response = session.get(path, "HTTP_HOST" => "localhost", "HTTPS" => "on")
      abort "GET #{path} returned #{response.status}:\n#{response.body[0, 500]}" unless response.status == 200

      file = dist.join(path.delete_prefix("/"), "index.html")
      FileUtils.mkdir_p(file.dirname)
      file.write(response.body)
      puts "  #{path.ljust(14)} → #{file.relative_path_from(Rails.root)}"
    end

    # Precompiled assets in public/ would shadow live ones in development.
    Rake::Task["assets:clobber"].invoke
    puts "Exported #{STATIC_ROUTES.size} pages to dist/"
  end
end
