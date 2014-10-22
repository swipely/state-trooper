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

    // describe the fetchers and persisters for each piece of state
    // fetchers and persisters are functions that should return channels
    dataStore: {
      'serverReport': { fetcher: serverReportFetcher },
      'bio': { fetcher: bioFetcher, persister: bioPersister },
      'activity': { fetcher: activityFetcher }
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
    this.props.cursor.persist();
  }
});
```

fetchers and persisters will be called with the following arguments:

- channel
- path
- state for path

They are expected to put an object on the channel when they have finished their operation.
The object must be like so: `{ path: path, value: newStateValue }`
