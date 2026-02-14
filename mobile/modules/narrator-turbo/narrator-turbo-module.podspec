require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "NarratorTurboModule"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/vibecode/narrator-turbo"
  s.license      = package["license"]
  s.authors      = { "Vibecode" => "support@vibecode.com" }

  s.platforms    = { :ios => "13.4" }
  s.source       = { :git => "https://github.com/vibecode/narrator-turbo.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"

  s.dependency "React-Core"
  s.swift_version = "5.0"

  # New Architecture support
  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "SWIFT_OPTIMIZATION_LEVEL" => "-Onone"
  }
end
