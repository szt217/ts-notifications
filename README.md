https://github.com/szt217/root-take-home/assets/17673935/806fbd0c-a799-4b22-bf79-3e9e4157ce04


This project demonstrates how a React Native frontend might handle a notification user interface.

Disclaimer: I ran with the project a bit beyond the requirements. Along with the requested criteria, I wanted to show how features shown in the take home project spec screenshot might actually be implemented in a React Native frontend. This project is a good start.

#### Getting Started:

This project uses Expo. To run the project, you’ll want to download the Expo Go app from the apple app store or google play store. An iOS simulator or Android emulator can also run the project (Note: I'm using a Mac and have always used one for React Native development. I can't speak to experience/troubleshooting on Windows)

Xcode installation should not be required to run the app using Expo Go on a physical device. However you'll need it if you want to run the application on an iOS simulator. Same goes for Android Studio and Android emulators.

Project was developed using node v18.16.1. Dependecies are managed with yarn. 

1. Setup node and install yarn (`npm install -g yarn`).
2. From project root, run `yarn` to install dependencies.
3. Run `yarn preview` to start the project in production mode.
4. Scan the generated QR code with a device that has Expo Go installed. If your computer and device are on the same network, your device should recognize the dev server and open the project (A USB connection to your computer should also work too.).

If there are any issues with getting things going locally, I'm happy to demo the project.

#### Description:

This project was started using a create-expo-app template. It uses TypeScript, React Native and Expo Router to build a simple UI to view notifications in the order they are created. The notifications screen has a few filters for different notification views. The filters drive a notification query which fetches filtered notifications from the mock data provider. The query is paginated, showcasing how a user could scroll back in their history to view notifications from the beginning of time (or as far back as the backend decides to save data). Unread notifications are marked by a blue dot on the right side of the notification. User’s may tap the notification rows to mark them as read. Users can also interact with friend request notifications and either accept or decline requests. New notifications are tracked in a badge in the lower tab bar with a value that comes from the data provider from another endpoint.

There is some high level color constant, component and theming work done. Admittedly, this was included in the create-expo-app template, but I left it in and worked off of it to showcase how a component library might be started and how light and dark mode could be included out of the box (the app uses system settings as to determine whether or not to use light or dark theming).

The mock data provider stores notifications in memory. On app start I trigger an interval which simulates the generation of new notifications. The notifications are enqueued in a message queue in memory. A web socket client “connects” to the data provider on app start and ingests the queue. New and updated notifications are handled by the callback as they’re received, which interacts directly with the notification cache built with Redux Toolkit.

The underlying notification state management system is architected with Redux Toolkit (RTK). Notifications are delivered to the application through a mock data provider that lives in memory. The provider has hardcoded data to start and the client interacts with it through RTK mutations. There is also a mock websocket client that starts when the app is opened. The client simulates notification packets coming in from a channel subscription in the form of newly generated notifications and updates queued by the data provider. These notification packets are ingested by the notification slice and in turn populated by the notification list as desired.

The notification slice handles the sorting of incoming notifications. The adapter ensures that ids used by the notification list are sorted in order of their created_at timestamp. The slice will ignore any incoming notification upserts if the entity is already in the cache and the incoming updated_at timestamp is not greater than the cached updated_at timestamp (Great for deduping updates that could arrive from both an endpoint response and a socket packet, as showcased in the example). The cache is reset when changing routes in order to preserve memory. Selectors are then used by React Native components to get notification data and construct it in a way that best serves the UI. In the project I generate section headers for the list UI to render to organize notifications by date.

#### Why:

I started with an expo template because it’s a great base to start from. I also enjoy the expo development environment.

TypeScript is a necessity here, in my opinion. I developed data structures in my type.ts file which serve as the backbone for development in my project. I created additional notification types and interaction features to demonstrate how TypeScript narrowing works to help ensure type safety statically to promote features that work at runtime the first time.

I mentioned before that the template came with the colors, component and theming base which I extended a bit to fit my needs. Ideally, a masterfile of colors, typography, and other standards is established earlier in any major app development process, along with common components that can be constructed from these standards. The Tailwind style guide is a standard that I usually reach for if a standard isn’t available.

The template also uses Expo Router for file based routing. I’ve only used React Navigation in the past in professional settings but I gave this a shot since it’s a newer expo library and was included in the template. I appreciate the simplistic and organization-forward approach of file based routing from my experience with NextJS. Expo router is built on top of react navigation and is less extensible at this point, so I’d likely still elect for React Navigation.

I created a simple tab navigation to demonstrate how notifications would be received by the app from other screens. From the home screen you can see the notification badge counter tick up as notification packets come in and tick down as notifications are marked as read. This value comes from a selector that uses the notifications cache.

The notifications list is rendered with React Native’s native FlatList, a great tool for larger lists that takes advantage of virtualization techniques to save on re-rendering processing. This plays well with RTK strategies I’ll get into below. Scrolling down the list triggers a new data fetch. The page will continue to fetch new data until the list end is reached. The FlatList is implemented in a way that it will maintain scroll position when new updates are received at the top of the list, which I believe is a necessity for a smooth experience in a feature like this, or something like a chat feature too.

The mock data provider stores notifications in memory in a couple of useful forms that get the job done. Quick and dirty, not too much to say here. The mock Websocket client demonstrates how and where the frontend could spin up a streaming connection. Generally, this is behind some level of authentication.

Data comes from either the paginated notification query endpoint or notification packets. Because of the paginated query, I elected to send notification metadata in a separate endpoint and packet message. This value is ingested from either data source and stored in the notifications cache and is a suitable solution to not have the cache have every unread notification stored at all times.

RTK is my go-to for more complicated frontends that can benefit from kitchen sink in state management. Redux has come a long way and the toolkit is the Redux team’s answer to a lot of things that people used to complain about. Adapters make it easy to create caches for common entities. State can be sorted as desired and can also be extended to create other data forms that are beneficial. In the project I’ve created a notifications slice with an adapter that accepts data from both the notifications endpoint and notification packets. With the inclusion of an updated_at timestamp, I’ve added a simple strategy for ignoring updates for redundant data. Skipped updates can prevent updates from propagating to the UI where rerenders can occur, which can be very costly in React Native app performance (Side Note: where possible, extra processing and comparison is generally preferred to UI rerenders. That’s demonstrated more later on).

Selectors are used in the project to provide data from the cache in forms that are beneficial to the UI. In one example in the project, I’ve constructed a quick data form that can be interpreted by the FlatList to determine whether or not to show a notification section header or a notification row. These selector results are memoized which is great for limiting the changes that propagate to the UI, where state updates may normally cause rerenders to occur. When dealing with objects and array results, a shallow equals check is a better alternative to allowing a new object or array result from the selector to rerender a UI. In the case of the aforementioned selector, I perform a shallow equal check on the string array result, to prevent rerenders on this selector where state updates to any notification entities may cause one.

The selector returns notification ids and passes them to individual notification rows. This allows individual notification rows to subscribe to their designated notification entities in the store. This way updates to these notification entities (on tap to mark as read, or resolving a friend request) only update their individual row and not the entire list, which is a nice performance boost. This paired with limiting the number of subscribed rows with FlatList’s virtualization promotes a very fast and responsive UI.

#### What to improve with more time:

The UI is simple so there’s much to improve on in that aspect. I would refactor styles in favor of a federated design system spec, and probably go with a library like emotion over native StyleSheets.

The pagination query is simple (and not really pagination) but works to demonstrate how infinite scrolling would feel in this feature. This can be revised and there would be small updates to the query and notification slice to handle this.

Additional optimizations could be made to the way that notification packets are ingested by the notifications cache, but it would depend on how else notifications might be presented in the app. On the same note, there could be additional cache cleanup jobs performed after some time when notifications are not actively viewed. RTK Query has built in cache cleanup for inactive queries based on a default TTL (can be customized). The entities in the notificaitons adapter could be cleaned up on a similar basis.

In the interest of time, I skipped on tests. I would ensure that core logic is tested with appropriate coverage.
