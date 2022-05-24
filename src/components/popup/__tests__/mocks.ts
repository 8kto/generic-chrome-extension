export const POPUP_LAYOUT = `
<!-- Tabs -->
<div class="componentWrapper">
  <div class="tabs">
    <button
      class="tabTitle active button"
      data-target="experiments-list"
      title="Experiments list"
    >
      📜
    </button>
    <button
      class="tabTitle button"
      data-target="experiments-json"
      title="JSON"
    >
      ⚙️
    </button>
    <button
      id="button--show-info"
      class="tabTitle button"
      data-target="experiments-details"
      title="Show details"
    >
      🕵️
    </button>
    <button
      class="tabTitle button"
      data-target="experiments-docs"
      title="Documentation"
    >
      ℹ️
    </button>
    <button
      id="button--add-new"
      class="tabTitle button"
      title="Add new experiment"
    >
      ➕
    </button>
  </div>

  <div id="messages">
    <div class="message message--info">Loading...</div>
  </div>

  <!-- Tabs content -->
  <!-- Experiments list -->
  <div id="experiments-list" class="tabContent active">
    <div id="container"></div>

    <input
      id="reset-feature-flags-cookie"
      class="button"
      type="button"
      value="Reset feature flags"
      title="Clear cookies and reload page to fetch the new ones"
    />
    <input
      id="reload-tab"
      class="button"
      title="Click to apply changes, reload page, and fetch updated feature flags"
      type="button"
      value="🔄 Apply"
      hidden
    />
  </div>

  <!-- Experiments JSON -->
  <div id="experiments-json" class="tabContent">
    <textarea
      class="form-control--textarea"
      id="experiments-json-container"
      cols="36"
      rows="20"
      autocomplete="off"
      spellcheck="false"
    ></textarea>
    <input
      id="save-json"
      class="button"
      title="Click to reload page and fetch updated feature flags"
      type="button"
      value="🔄 Apply"
      hidden
    />
  </div>

  <!-- Feature flags & more details -->
  <div id="experiments-details" class="tabContent">
    <ul class="detailsList">
      <li>
        <strong>
          <a
            href="https://github.com/RedTecLab/fock/#public-urls"
            target="_blank"
          >
            Branch name
          </a></strong
        >: <br />
        <span
          id="feature-branch-container"
          title="Current feature branch name on the preview server (x-featurebranch)"
          >NA</span
        >
      </li>
      <li>
        <strong title="feature-flag-targeting">Targeting parameters</strong
        >: <br /><span id="feature-flag-targeting-params-container"
          >NA</span
        >
      </li>
    </ul>
  </div>

  <!-- Docs -->
  <div id="experiments-docs" class="tabContent">
    <p>
      <strong>Important</strong>: Feature flags cookie does not contain all
      possible variation names, so the extension tries to predict and
      display the 3 (minimum) possible variations instead +
      <code>default</code> one.
    </p>

    <p><strong>Version</strong>: <span id="igel-version"></span></p>
  </div>
</div>
`

export const chromeMock: typeof chrome = {
  //@ts-ignore
  runtime: {
    getManifest: jest.fn().mockReturnValue({
      version: 'v1.1.1',
    }),
  },
  //@ts-ignore
  scripting: { executeScript: jest.fn() },
  //@ts-ignore
  tabs: {
    query: jest.fn().mockReturnValue([{ tabId: 42 }]),
  },
}
