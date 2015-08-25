state trooper
=============

![](https://travis-ci.org/swipely/state-trooper.svg?branch=master)

# Dependencies

StateTrooper uses generator functions and js-csp.  You can use babeljs for
transpilation of your code, but currently it won't transpile libs in
node_modules. For this reason js-csp is vendored at version 0.4.1.  If you want
to use StateTrooper in node and with babeljs, you'll need to vendor
StateTrooper in a similar way.

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
    const bio = this.props.cursor.deref();

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

Fetchers will be called with a `cursor` and a `rootCursor`
Persisters will be called with a `cursor`, a `change` and a `rootCursor`

To have your fetchers or persisters change the state, simply use one of the
mutating functions of a cursor.

# How state changes are applied
State change are applied one after each other. Making a change will always
produce a new top level cursor with the update state.  However there are cases
where you can call request several mutate changes via any of the mutative
functions on a cursor (`set`, `replace`, `add`, `remove`) in short succession.
In cases like this the state changes might be requested before the first change
is propegated. StateTrooper ensures that the changes are applied sequentially
regardless of wether or not a new cursor has been added to the cursor chan yet.

# Cursor API:
Given this state:
```javascript
{
  foo: {
    bar: 'baz',
    beep: ['hey', 'yo']
  }
}
```

### cursor#refine
```javascript
cursor.refine('foo.bar');
```
Calling cursor#refine with a string path will create a new cursor for that part
of the state.  This is useful as you go down the component tree and the focus
your component and state on a specific domain.

### cursor#set
```javascript
cursor.refine('foo').set({ bar: 'foo' });
```
Calling cursor#set will merge the changes into the state at the path of the
cursor. Similar to reacts setState.
In this example the state change will result in:
```javascript
{
  foo: {
    bar: 'foo',
    beep: ['hey', 'yo']
  }
}
```
set is only available on Objects/Maps

### cursor#replace
```javascript
cursor.refine('foo').replace('bar');
```
Calling cursor#replace will replace the entire subtree at the path of the cursor
In this example the state change will result in:
```javascript
{
  foo: 'bar'
}
```

### cursor#remove
```javascript
cursor.refine('foo.beep.0').remove();
```
Calling cursor#remove will remove the entire subtree at the path of the cursor.
This works on both arrays and objects.
In this example the state change will result in:
```javascript
{
  foo: {
    bar: 'baz',
    beep: ['yo']
  }
}
```

### cursor#add
```javascript
cursor.refine('foo.beep').add('blah');
```
Calling cursor#remove will remove the entire subtree at the path of the cursor.
This works on both arrays and objects.
In this example the state change will result in:
```javascript
{
  foo: {
    bar: 'baz',
    beep: ['hey', 'yo', 'blah']
  }
}
```
add is only available on Arrays/Lists

### cursor#map
```javascript
cursor.refine('foo.beep').map((itemCursor) => {
  // ...
});
```
map makes it easier to loop over a list in the state and get refined cursors
for each element in that array. Useful for passing a cursor to each item
component in a list.
map is only available on Arrays/Lists
