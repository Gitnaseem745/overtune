import ActivityKit
import Foundation

public struct MusicActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var trackTitle: String
        public var artistName: String
        public var albumTitle: String
        public var isPlaying: Bool
        public var progress: Double // 0.0 to 1.0
        public var currentTime: Double
        public var duration: Double
        public var artworkBase64: String?
        public var updatedAt: Double

        public init(
            trackTitle: String,
            artistName: String,
            albumTitle: String = "",
            isPlaying: Bool,
            progress: Double = 0.0,
            currentTime: Double = 0.0,
            duration: Double = 0.0,
            artworkBase64: String? = nil,
            updatedAt: Double = Date().timeIntervalSince1970
        ) {
            self.trackTitle = trackTitle
            self.artistName = artistName
            self.albumTitle = albumTitle
            self.isPlaying = isPlaying
            self.progress = progress
            self.currentTime = currentTime
            self.duration = duration
            self.artworkBase64 = artworkBase64
            self.updatedAt = updatedAt
        }
    }

    public var trackId: Int
    public var playlistName: String?

    public init(trackId: Int, playlistName: String? = nil) {
        self.trackId = trackId
        self.playlistName = playlistName
    }
}
