// Startup applies every preference. Later changes respect a window the user moved.
export function syncWidgetSettings(widget, previous, next, position, snoozing) {
  if (!previous || previous.widgetWidth !== next.widgetWidth || previous.widgetHeight !== next.widgetHeight) {
    const [width, height] = widget.getSize();
    if (width !== next.widgetWidth || height !== next.widgetHeight) {
      widget.setSize(next.widgetWidth, next.widgetHeight);
    }
  }
  if (!previous || previous.corner !== next.corner || previous.display !== next.display) position();
  if (!previous || previous.opacity !== next.opacity) widget.setOpacity(next.opacity);
  if (!previous || previous.widget !== next.widget) {
    if (next.widget && !snoozing) widget.showInactive();
    else widget.hide();
  }
}
