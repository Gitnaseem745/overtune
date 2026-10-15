import WidgetKit
import SwiftUI

@main
struct OvertoneWidgetBundle: WidgetBundle {
    var body: some Widget {
        OvertoneNowPlayingWidget()
        OvertoneLiveActivity()
    }
}
