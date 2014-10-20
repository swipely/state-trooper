state trooper
=============

# Example Usage

Call `StateTrooper.patrol` in your route handler/main app entry point
```javascript
go(function*() {
  let component = React.renderComponent(
    <Server/>,
    document.querySelector('body')
  );

  const cursorChan = StateTrooper.patrol({
    // describe the state for the page
    state: {
      serverReport: null,
      bio: null,
      activity: null
    },

    // describe the channels for each piece of state
    chans: {
      'serverReport': { read: serverReportReadChan },
      'bio': { read: bioReadChan, write: bioWriteChan },
      'activity': { read: activityReadChan }
    }
  });

  let cursor;
  while(cursor = yield take(cursorChan)) {
    // update the component cursor prop everytime it changes
    component.setProps({ cursor: cursor });
  }
});
```

Using cursors inside of the components
```javascript
const Server = React.createClass({
  render: function () {
    return (
      <div>
        <ServerReport cursor={this.props.cursor.refine('serverReport')}/>
        <Bio cursor={this.props.cursor.refine('bio')}/>
      </div>
    );
  }
});

const Bio = React.createClass({
  render: function () {
    const bio = this.props.cursor.value;

    if (bio) {
      return (
        <form>
          <label>Name</label>
          <input type='text' value={bio.name} onChange={this.handleChange}/>
          <button onClick={this.handleSaveClick}>Save</button>
        </form>
      );
    }
    else {
      return null;
    }
  },

  handleChange: function (ev) {
    this.props.cursor.set({ name: ev.target.value });
  },

  handleSaveClick: function () {
    this.props.cursor.sync();
  }
});
```


