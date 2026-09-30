import {
  CommonActions,
  NavigationProp,
  ParamListBase,
} from '@react-navigation/native';

/**
 * Switches to a primary screen the way a tab bar does: the stack becomes
 * [Home, target] (or just [Home]). Pressing Back from a tab therefore always
 * returns to Home, and the stack never piles up when the user hops between
 * tabs. The existing Home screen is kept mounted, not recreated.
 */
export const switchTab = (
  navigation: Pick<NavigationProp<ParamListBase>, 'dispatch'>,
  target: string,
) => {
  navigation.dispatch(state => {
    const home = state.routes.find(route => route.name === 'Home') ??
      state.routes[0];
    const routes = target === 'Home' ? [home] : [home, { name: target }];

    return CommonActions.reset({
      ...state,
      routes,
      index: routes.length - 1,
    });
  });
};