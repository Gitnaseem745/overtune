import WidgetKit
import SwiftUI

public struct OvertonePlaybackEntry: TimelineEntry {
    public let date: Date
    public let model: WidgetPlaybackModel
}

public struct OvertoneWidgetProvider: TimelineProvider {
    public func placeholder(in context: Context) -> OvertonePlaybackEntry {
        OvertonePlaybackEntry(date: Date(), model: .fallback)
    }

    public func getSnapshot(in context: Context, completion: @escaping (OvertonePlaybackEntry) -> Void) {
        let current = WidgetDataManager.shared.loadCurrentPlayback()
        completion(OvertonePlaybackEntry(date: Date(), model: current))
    }

    public func getTimeline(in context: Context, completion: @escaping (Timeline<OvertonePlaybackEntry>) -> Void) {
        let current = WidgetDataManager.shared.loadCurrentPlayback()
        let entry = OvertonePlaybackEntry(date: Date(), model: current)
        // Refresh every 15 minutes or when notified by the app
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

public struct OvertoneNowPlayingWidget: Widget {
    public let kind: String = "OvertoneNowPlayingWidget"

    public init() {}

    public var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: OvertoneWidgetProvider()) { entry in
            OvertoneWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Now Playing")
        .description("Track current playback, see album artwork, and control music directly from your Home Screen.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct OvertoneWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: OvertonePlaybackEntry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(model: entry.model)
        case .systemMedium:
            MediumWidgetView(model: entry.model)
        case .systemLarge:
            LargeWidgetView(model: entry.model)
        default:
            MediumWidgetView(model: entry.model)
        }
    }
}

// ── Small Widget View ──────────────────────────────────────────────────────
struct SmallWidgetView: View {
    let model: WidgetPlaybackModel

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            // Header
            HStack {
                Text("OVERTONE")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(Color(red: 0.98, green: 0.66, blue: 0.15))
                    .kerning(1.0)
                Spacer()
                Image(systemName: model.isPlaying ? "waveform" : "pause.circle.fill")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(Color(red: 0.98, green: 0.66, blue: 0.15))
            }

            Spacer(minLength: 2)

            // Artwork
            if let b64 = model.artworkBase64,
               let data = Data(base64Encoded: b64),
               let uiImage = UIImage(data: data) {
                Image(uiImage: uiImage)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 52, height: 52)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(Color(red: 0.98, green: 0.66, blue: 0.15).opacity(0.35), lineWidth: 1)
                    )
            } else {
                ZStack {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(Color(red: 0.16, green: 0.12, blue: 0.05))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .stroke(Color(red: 0.98, green: 0.66, blue: 0.15).opacity(0.35), lineWidth: 1)
                        )
                    Image(systemName: "music.note")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(Color(red: 0.98, green: 0.66, blue: 0.15))
                }
                .frame(width: 52, height: 52)
            }

            Spacer(minLength: 2)

            // Title & Artist
            VStack(alignment: .leading, spacing: 2) {
                Text(model.title)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.white)
                    .lineLimit(1)

                Text(model.artist)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Color(red: 0.88, green: 0.84, blue: 0.76))
                    .lineLimit(1)
            }

            // Amber Progress Capsule
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.white.opacity(0.12))
                        .frame(height: 3)
                    Capsule()
                        .fill(Color(red: 0.98, green: 0.66, blue: 0.15))
                        .frame(width: max(0, min(geo.size.width, geo.size.width * CGFloat(model.progress))), height: 3)
                }
            }
            .frame(height: 3)
        }
        .padding(14)
        .widgetURL(URL(string: "overtune://now-playing"))
        .background(
            LinearGradient(
                colors: [Color(red: 0.09, green: 0.07, blue: 0.03), Color(red: 0.14, green: 0.10, blue: 0.04)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
    }
}

// ── Medium Widget View ─────────────────────────────────────────────────────
struct MediumWidgetView: View {
    let model: WidgetPlaybackModel

    var body: some View {
        HStack(spacing: 14) {
            // Left: Large Album Art Squircle
            if let b64 = model.artworkBase64,
               let data = Data(base64Encoded: b64),
               let uiImage = UIImage(data: data) {
                Image(uiImage: uiImage)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 104, height: 104)
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .stroke(Color(red: 0.98, green: 0.66, blue: 0.15).opacity(0.4), lineWidth: 1.2)
                    )
                    .shadow(color: Color(red: 0.98, green: 0.66, blue: 0.15).opacity(0.18), radius: 8, x: 0, y: 2)
            } else {
                ZStack {
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .fill(Color(red: 0.16, green: 0.12, blue: 0.05))
                        .overlay(
                            RoundedRectangle(cornerRadius: 20, style: .continuous)
                                .stroke(Color(red: 0.98, green: 0.66, blue: 0.15).opacity(0.4), lineWidth: 1.2)
                        )
                    Image(systemName: "music.note")
                        .font(.system(size: 38, weight: .bold))
                        .foregroundColor(Color(red: 0.98, green: 0.66, blue: 0.15))
                }
                .frame(width: 104, height: 104)
            }

            // Right: Metadata, Progress & Transport Controls
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("OVERTONE MUSIC")
                        .font(.system(size: 9.5, weight: .bold))
                        .foregroundColor(Color(red: 0.98, green: 0.66, blue: 0.15))
                        .kerning(1.2)

                    Spacer()

                    // Equalizer wave
                    HStack(spacing: 2) {
                        ForEach(0..<3) { i in
                            RoundedRectangle(cornerRadius: 1)
                                .fill(Color(red: 0.98, green: 0.66, blue: 0.15))
                                .frame(width: 2.2, height: model.isPlaying ? CGFloat([8, 13, 7][i]) : 4)
                        }
                    }
                }

                Text(model.title)
                    .font(.system(size: 15.5, weight: .bold))
                    .foregroundColor(.white)
                    .lineLimit(1)

                Text(model.artist)
                    .font(.system(size: 12.5, weight: .medium))
                    .foregroundColor(Color(red: 0.88, green: 0.84, blue: 0.76))
                    .lineLimit(1)

                Spacer(minLength: 2)

                // Progress Bar with Time Labels
                VStack(spacing: 2) {
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule()
                                .fill(Color.white.opacity(0.14))
                                .frame(height: 3.5)
                            Capsule()
                                .fill(Color(red: 0.98, green: 0.66, blue: 0.15))
                                .frame(width: max(0, min(geo.size.width, geo.size.width * CGFloat(model.progress))), height: 3.5)
                        }
                    }
                    .frame(height: 3.5)

                    HStack {
                        Text(formatWidgetTime(model.currentTime))
                            .font(.system(size: 9, weight: .medium, design: .monospaced))
                            .foregroundColor(.white.opacity(0.55))
                        Spacer()
                        Text("-" + formatWidgetTime(max(0, model.duration - model.currentTime)))
                            .font(.system(size: 9, weight: .medium, design: .monospaced))
                            .foregroundColor(.white.opacity(0.55))
                    }
                }

                // Transport Controls
                HStack(spacing: 20) {
                    Link(destination: URL(string: "overtune://prev")!) {
                        Image(systemName: "backward.fill")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(.white.opacity(0.8))
                    }

                    Link(destination: URL(string: "overtune://play")!) {
                        ZStack {
                            Circle()
                                .fill(Color(red: 0.98, green: 0.66, blue: 0.15))
                                .frame(width: 32, height: 32)
                            Image(systemName: model.isPlaying ? "pause.fill" : "play.fill")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(Color(red: 0.12, green: 0.08, blue: 0.02))
                        }
                    }

                    Link(destination: URL(string: "overtune://next")!) {
                        Image(systemName: "forward.fill")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(.white.opacity(0.8))
                    }

                    Spacer()

                    Link(destination: URL(string: "overtune://now-playing")!) {
                        Image(systemName: "arrow.up.left.and.arrow.down.right")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(Color(red: 0.98, green: 0.66, blue: 0.15))
                    }
                }
                .padding(.top, 2)
            }
        }
        .padding(14)
        .widgetURL(URL(string: "overtune://now-playing"))
        .background(
            LinearGradient(
                colors: [Color(red: 0.08, green: 0.06, blue: 0.03), Color(red: 0.13, green: 0.10, blue: 0.04)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
    }
}

// ── Large Widget View ──────────────────────────────────────────────────────
struct LargeWidgetView: View {
    let model: WidgetPlaybackModel

    var body: some View {
        VStack(spacing: 12) {
            // Medium widget presentation at top
            MediumWidgetView(model: model)
                .frame(maxHeight: 146)

            Divider()
                .background(Color.white.opacity(0.12))

            // Up Next in Queue Section
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("UP NEXT")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(Color(red: 0.98, green: 0.66, blue: 0.15))
                        .kerning(1.2)
                    Spacer()
                    Text("\(model.queue.count) songs")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.white.opacity(0.5))
                }

                if model.queue.isEmpty {
                    Text("Queue is empty. Pick a song or playlist in Overtone.")
                        .font(.system(size: 11, weight: .regular))
                        .foregroundColor(.white.opacity(0.4))
                        .padding(.vertical, 8)
                } else {
                    ForEach(model.queue.prefix(3)) { item in
                        HStack(spacing: 10) {
                            RoundedRectangle(cornerRadius: 6)
                                .fill(Color(red: 0.18, green: 0.14, blue: 0.06))
                                .frame(width: 28, height: 28)
                                .overlay(
                                    Image(systemName: "music.note")
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundColor(Color(red: 0.98, green: 0.66, blue: 0.15))
                                )

                            VStack(alignment: .leading, spacing: 1) {
                                Text(item.title)
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(.white)
                                    .lineLimit(1)
                                Text(item.artist)
                                    .font(.system(size: 10, weight: .medium))
                                    .foregroundColor(.white.opacity(0.6))
                                    .lineLimit(1)
                            }

                            Spacer()

                            if let dur = item.duration, dur > 0 {
                                Text(formatWidgetTime(dur))
                                    .font(.system(size: 10, weight: .medium, design: .monospaced))
                                    .foregroundColor(.white.opacity(0.4))
                            }
                        }
                    }
                }
            }

            Spacer(minLength: 2)

            // Bottom Quick Actions
            HStack(spacing: 12) {
                Link(destination: URL(string: "overtune://playlist/favorites")!) {
                    HStack(spacing: 4) {
                        Image(systemName: "heart.fill")
                            .font(.system(size: 11))
                        Text("Favorites")
                            .font(.system(size: 11, weight: .bold))
                    }
                    .foregroundColor(Color(red: 0.98, green: 0.66, blue: 0.15))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color(red: 0.18, green: 0.14, blue: 0.06))
                    .cornerRadius(8)
                }

                Link(destination: URL(string: "overtune://now-playing")!) {
                    HStack(spacing: 4) {
                        Image(systemName: "play.circle.fill")
                            .font(.system(size: 11))
                        Text("Full Player")
                            .font(.system(size: 11, weight: .bold))
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color.white.opacity(0.12))
                    .cornerRadius(8)
                }

                Spacer()
            }
        }
        .padding(14)
        .widgetURL(URL(string: "overtune://now-playing"))
        .background(
            LinearGradient(
                colors: [Color(red: 0.08, green: 0.06, blue: 0.03), Color(red: 0.13, green: 0.10, blue: 0.04)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
    }
}

fileprivate func formatWidgetTime(_ seconds: Double) -> String {
    let secs = max(0, Int(seconds))
    let m = secs / 60
    let s = secs % 60
    return String(format: "%d:%02d", m, s)
}
