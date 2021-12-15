# LSC pre-fetch prediction engine

This addon extension tries to predict the link an user may click from his mouse actions and will pre-fetch the linked contents in case a link was matched. This should be used to avoid producing huge overloads when pre-fetching all linked contents without any reason. In an optimal environment you will get the same speed when clicking a link, as when not using the prediction engine - but you may avoid a lot of unnecessary traffic.
