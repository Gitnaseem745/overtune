import ActivityKit
import WidgetKit
import SwiftUI

public struct OvertoneLiveActivity: Widget {
    public init() {}

    public var body: some WidgetConfiguration {
        ActivityConfiguration(for: MusicActivityAttributes.self) { context in
            // Lock Screen Live Activity Presentation
            LockScreenLiveActivityView(state: context.state)
                .activityBackgroundTint(Color(red: 0.08, green: 0.06, blue: 0.03))
                .activitySystemActionForegroundColor(Color(red: 0.98, green: 0.66, blue: 0.15))
        } dynamicIsland: { context in
            DynamicIsland {
                // ── Dynamic Island Expanded Presentation ───────────────────
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 8) {
                        if let b64 = context.state.artworkBase64,
                           let data = Data(base64Encoded: b64),
                           let uiImage = UIImage(data: data) {
                            Image(uiImage: uiImage)
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                .frame(width: 46, height: 46)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                                        .stroke(Color(red: 0.98, green: 0.66, blue: 0.15).opacity(0.4), lineWidth: 1)
                                )
                        } else {
                            ZStack {
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .fill(Color(red: 0.14, green: 0.10, blue: 0.04))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                                            .stroke(Color(red: 0.98, green: 0.66, blue: 0.15).opacity(0.4), lineWidth: 1)
                                    )
                                Image(systemName: "music.note")
                                    .font(.system(size: 18, weight: .bold))
                                    .foregroundColor(Color(red: 0.98, green: 0.66, blue: 0.15))
                            }
                            .frame(width: 46, height: 46)
                        }
                    }
                    .padding(.leading, 6)
                }

                DynamicIslandExpandedRegion(.trailing) {
                    // Audio waveform equalizer animation in Dynamic Island
                    HStack(spacing: 3) {
                        ForEach(0..<3) { i in
                            RoundedRectangle(cornerRadius: 1.5)
                                .fill(Color(red: 0.98, green: 0.66, blue: 0.15))
                                .frame(width: 3, height: context.state.isPlaying ? CGFloat([14, 20, 12][i]) : 5)
                        }
                    }
                    .padding(.trailing, 8)
                }

                DynamicIslandExpandedRegion(.center) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(context.state.trackTitle)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                            .lineLimit(1)

                        Text(context.state.artistName)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(Color(red: 0.99, green: 0.90, blue: 0.67))
                            .lineLimit(1)
                    }
                    .padding(.horizontal, 4)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 8) {
                        // Progress bar with time labels
                        VStack(spacing: 3) {
                            GeometryReader { geo in
                                ZStack(alignment: .leading) {
                                    Capsule()
                                        .fill(Color.white.opacity(0.15))
                                        .frame(height: 4)

                                    Capsule()
                                        .fill(
                                            LinearGradient(
                                                colors: [
                                                    Color(red: 0.98, green: 0.66, blue: 0.15),
                                                    Color(red: 0.99, green: 0.75, blue: 0.20)
                                                ],
                                                startPoint: .leading,
                                                endPoint: .trailing
                                            )
                                        )
                                        .frame(width: max(0, min(geo.size.width, geo.size.width * CGFloat(context.state.progress))), height: 4)
                                }
                            }
                            .frame(height: 4)

                            HStack {
                                Text(formatTime(context.state.currentTime))
                                    .font(.system(size: 10, weight: .medium, design: .monospaced))
                                    .foregroundColor(.white.opacity(0.6))

                                Spacer()

                                Text("-" + formatTime(max(0, context.state.duration - context.state.currentTime)))
                                    .font(.system(size: 10, weight: .medium, design: .monospaced))
                                    .foregroundColor(.white.opacity(0.6))
                            }
                        }

                        // Transport playback buttons
                        HStack(spacing: 32) {
                            Link(destination: URL(string: "overtune://prev")!) {
                                Image(systemName: "backward.fill")
                                    .font(.system(size: 17, weight: .semibold))
                                    .foregroundColor(.white.opacity(0.85))
                            }

                            Link(destination: URL(string: "overtune://play")!) {
                                ZStack {
                                    Circle()
                                        .fill(Color(red: 0.98, green: 0.66, blue: 0.15))
                                        .frame(width: 38, height: 38)
                                    Image(systemName: context.state.isPlaying ? "pause.fill" : "play.fill")
                                        .font(.system(size: 16, weight: .bold))
                                        .foregroundColor(Color(red: 0.12, green: 0.08, blue: 0.02))
                                }
                            }

                            Link(destination: URL(string: "overtune://next")!) {
                                Image(systemName: "forward.fill")
                                    .font(.system(size: 17, weight: .semibold))
                                    .foregroundColor(.white.opacity(0.85))
                            }
                        }
                        .padding(.top, 2)
                    }
                    .padding(.horizontal, 12)
                    .padding(.bottom, 6)
                }
            } compactLeading: {
                // ── Compact Leading: Mini Squircle Album Art ──────────────
                HStack(spacing: 4) {
                    if let b64 = context.state.artworkBase64,
                       let data = Data(base64Encoded: b64),
                       let uiImage = UIImage(data: data) {
                        Image(uiImage: uiImage)
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(width: 19, height: 19)
                            .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
                    } else {
                        ZStack {
                            RoundedRectangle(cornerRadius: 6, style: .continuous)
                                .fill(Color(red: 0.98, green: 0.66, blue: 0.15).opacity(0.3))
                            Image(systemName: "music.note")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(Color(red: 0.98, green: 0.66, blue: 0.15))
                        }
                        .frame(width: 19, height: 19)
                    }
                }
            } compactTrailing: {
                // ── Compact Trailing: Amber Equalizer Bars ─────────────────
                HStack(spacing: 2) {
                    ForEach(0..<3) { i in
                        RoundedRectangle(cornerRadius: 1)
                            .fill(Color(red: 0.98, green: 0.66, blue: 0.15))
                            .frame(width: 2.2, height: context.state.isPlaying ? CGFloat([9, 14, 8][i]) : 4)
                    }
                }
            } minimal: {
                // ── Minimal: Amber Musical Note ────────────────────────────
                Image(systemName: "music.note")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(Color(red: 0.98, green: 0.66, blue: 0.15))
            }
        }
    }
}

// ── Lock Screen Live Activity Banner View ──────────────────────────────────
struct LockScreenLiveActivityView: View {
    let state: MusicActivityAttributes.ContentState

    var body: some View {
        HStack(spacing: 14) {
            // Album artwork squircle with warm ambient glow
            if let b64 = state.artworkBase64,
               let data = Data(base64Encoded: b64),
               let uiImage = UIImage(data: data) {
                Image(uiImage: uiImage)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 58, height: 58)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(Color(red: 0.98, green: 0.66, blue: 0.15).opacity(0.4), lineWidth: 1)
                    )
            } else {
                ZStack {
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(Color(red: 0.16, green: 0.12, blue: 0.05))
                        .overlay(
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .stroke(Color(red: 0.98, green: 0.66, blue: 0.15).opacity(0.4), lineWidth: 1)
                        )
                    Image(systemName: "music.note")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(Color(red: 0.98, green: 0.66, blue: 0.15))
                }
                .frame(width: 58, height: 58)
            }

            // Song Info & Controls
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("OVERTONE")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(Color(red: 0.98, green: 0.66, blue: 0.15))
                        .kerning(1.2)

                    Spacer()

                    // Equalizer bars
                    HStack(spacing: 2) {
                        ForEach(0..<3) { i in
                            RoundedRectangle(cornerRadius: 1)
                                .fill(Color(red: 0.98, green: 0.66, blue: 0.15))
                                .frame(width: 2.2, height: state.isPlaying ? CGFloat([8, 13, 7][i]) : 4)
                        }
                    }
                }

                Text(state.trackTitle)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(.white)
                    .lineLimit(1)

                Text(state.artistName)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(Color(red: 0.88, green: 0.84, blue: 0.76))
                    .lineLimit(1)

                // Progress Bar
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule()
                            .fill(Color.white.opacity(0.15))
                            .frame(height: 3.5)
                        Capsule()
                            .fill(Color(red: 0.98, green: 0.66, blue: 0.15))
                            .frame(width: max(0, min(geo.size.width, geo.size.width * CGFloat(state.progress))), height: 3.5)
                    }
                }
                .frame(height: 3.5)
            }

            // Quick Play / Pause Button
            Link(destination: URL(string: "overtune://play")!) {
                ZStack {
                    Circle()
                        .fill(Color(red: 0.98, green: 0.66, blue: 0.15))
                        .frame(width: 40, height: 40)
                    Image(systemName: state.isPlaying ? "pause.fill" : "play.fill")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(Color(red: 0.12, green: 0.08, blue: 0.02))
                }
            }
        }
        .padding(14)
        .background(Color(red: 0.10, green: 0.08, blue: 0.04))
    }
}

fileprivate func formatTime(_ seconds: Double) -> String {
    let secs = max(0, Int(seconds))
    let m = secs / 60
    let s = secs % 60
    return String(format: "%d:%02d", m, s)
}
