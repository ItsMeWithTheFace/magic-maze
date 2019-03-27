import gql from 'graphql-tag';

export const ENDTIME_QUERY = gameStateID => gql`
  subscription {
    endTimeUpdated(gameStateID: "${gameStateID}")
  }
`;

export const characterUpdateQuery = gql`
  subscription {
    characterUpdated(
      gameStateID: "5c9a99fe78ce17e4d91c171c",
      characterColour: "red",
    ) {
      colour
      coordinates {
        x
        y
      }
      locked
      itemClaimed
      characterEscaped
    }
  }
`;

export const mazeTileAddedQuery = gql`
  subscription {
    mazeTileAdded(gameStateID: "5c9a99fe78ce17e4d91c171c") {
      spriteID
      orientation
      cornerCoordinates {
        x
        y
      }
    }
  }
`;
