import Foundation
import SwiftUI

public let appGroupIdentifier = "group.com.overtone.music"

public struct WidgetQueueItem: Codable, Identifiable, Hashable {
    public var id: Int
    public var title: String
    public var artist: String
    public var duration: Double?
}

public struct WidgetPlaybackModel: Codable, Hashable {
    public var trackId: Int
    public var title: String
    public var artist: String
    public var album: String
    public var artworkBase64: String?
    public var isPlaying: Bool
    public var progress: Double // 0.0 to 1.0
    public var currentTime: Double
    public var duration: Double
    public var updatedAt: Double
    public var queue: [WidgetQueueItem]

    public static let fallback = WidgetPlaybackModel(
        trackId: 1,
        title: "No Track Playing",
        artist: "Overtone Music",
        album: "Sleek Collection",
        artworkBase64: nil,
        isPlaying: false,
        progress: 0.0,
        currentTime: 0.0,
        duration: 180.0,
        updatedAt: Date().timeIntervalSince1970,
        queue: []
    )
}

public class WidgetDataManager {
    public static let shared = WidgetDataManager()
    private let userDefaults = UserDefaults(suiteName: appGroupIdentifier)
    private let dataKey = "overtone_now_playing_data"

    public func loadCurrentPlayback() -> WidgetPlaybackModel {
        guard let data = userDefaults?.data(forKey: dataKey),
              let model = try? JSONDecoder().decode(WidgetPlaybackModel.self, from: data) else {
            return .fallback
        }
        return model
    }

    public func savePlayback(_ model: WidgetPlaybackModel) {
        if let data = try? JSONEncoder().encode(model) {
            userDefaults?.set(data, forKey: dataKey)
        }
    }
}
