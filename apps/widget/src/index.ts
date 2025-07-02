interface WidgetConfig {
  apiKey: string
  containerId: string
  apiUrl?: string
}

class RiddleMeThisWidget {
  private config: WidgetConfig

  constructor(config: WidgetConfig) {
    this.config = config
  }

  init() {
    const container = document.getElementById(this.config.containerId)
    if (!container) {
      console.error(`Container with id ${this.config.containerId} not found`)
      return
    }

    container.innerHTML = `
      <div style="border: 1px solid #ccc; padding: 20px; border-radius: 8px;">
        <h3>RiddleMeThis Widget</h3>
        <input type="text" placeholder="Riddle me this..." style="width: 100%; padding: 8px; margin: 8px 0;">
        <button style="padding: 8px 16px;">Ask</button>
        <div id="riddle-response" style="margin-top: 16px;"></div>
      </div>
    `
  }
}

interface RiddleMeThisGlobal {
  init: (config: WidgetConfig) => void
}

const globalWindow = window as typeof window & {
  RiddleMeThis?: RiddleMeThisGlobal
}

globalWindow.RiddleMeThis = {
  init: (config: WidgetConfig) => {
    const widget = new RiddleMeThisWidget(config)
    widget.init()
  },
}
