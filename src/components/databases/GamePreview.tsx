import { Box, Group, Stack, Text } from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";
import { useContext } from "react";
import { Chessground } from "@/chessground/Chessground";
import MoveControls from "../common/MoveControls";
import { useAtomValue, useSetAtom } from "jotai";
import { activeTabAtom } from "@/atoms/atoms";
import GameNotation from "../boards/GameNotation";
import {
  TreeDispatchContext,
  TreeStateContext,
} from "../common/TreeStateContext";
import { useImmerReducer } from "use-immer";
import treeReducer, { TreeState, getNodeAtPath } from "@/utils/treeReducer";
import { useNavigate } from "react-router-dom";
import { parsePGN } from "@/utils/chess";
import useSWR from "swr";
import { keyMapAtom } from "@/atoms/keybinds";

function GamePreviewWrapper({
  id,
  pgn,
  hideControls,
}: {
  id?: string;
  pgn: string;
  hideControls?: boolean;
}) {
  const { data: parsedGame, isLoading } = useSWR(pgn, async (game) => {
    return await parsePGN(game);
  });

  return (
    <>
      {isLoading && <Text ta="center">Loading...</Text>}
      {parsedGame && (
        <GamePreview game={parsedGame} hideControls={hideControls} id={id} />
      )}
    </>
  );
}

function GamePreview({
  id,
  game,
  hideControls,
}: {
  id?: string;
  game: TreeState;
  hideControls?: boolean;
}) {
  const navigate = useNavigate();

  const setActiveTab = useSetAtom(activeTabAtom);

  function goToGame() {
    if (id) {
      setActiveTab(id);
      navigate("/boards");
    }
  }

  const [treeState, dispatch] = useImmerReducer(treeReducer, game);

  const keyMap = useAtomValue(keyMapAtom);
  useHotkeys([
    [keyMap.PREVIOUS_MOVE.keys, () => dispatch({ type: "GO_TO_PREVIOUS" })],
    [keyMap.NEXT_MOVE.keys, () => dispatch({ type: "GO_TO_NEXT" })],
  ]);

  return (
    <TreeStateContext.Provider value={treeState}>
      <TreeDispatchContext.Provider value={dispatch}>
        <Group
          onClick={() => goToGame()}
          grow
          h="100%"
          sx={{ overflow: "hidden" }}
        >
          <PreviewBoard />
          {!hideControls && (
            <Stack h="100%">
              <GameNotation />
              <MoveControls
                goToStart={() => dispatch({ type: "GO_TO_START" })}
                goToEnd={() => dispatch({ type: "GO_TO_END" })}
                goToNext={() => dispatch({ type: "GO_TO_NEXT" })}
                goToPrevious={() => dispatch({ type: "GO_TO_PREVIOUS" })}
              />
            </Stack>
          )}
        </Group>
      </TreeDispatchContext.Provider>
    </TreeStateContext.Provider>
  );
}

function PreviewBoard() {
  const tree = useContext(TreeStateContext);
  const dispatch = useContext(TreeDispatchContext);
  const node = getNodeAtPath(tree.root, tree.position);
  const fen = node.fen;

  return (
    <Box
      onWheel={(e) => {
        if (e.deltaY > 0) {
          dispatch({
            type: "GO_TO_NEXT",
          });
        } else {
          dispatch({
            type: "GO_TO_PREVIOUS",
          });
        }
      }}
    >
      <Chessground
        coordinates={false}
        width={"100%"}
        height={"100%"}
        viewOnly={true}
        fen={fen}
        orientation={tree.headers.orientation || "white"}
      />
    </Box>
  );
}

export default GamePreviewWrapper;
