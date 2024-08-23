import { Container, Header, Icon } from "@cloudscape-design/components";
import {
  BoundingSphere,
  Cartesian2,
  Cartesian3,
  Color,
  Entity,
  ImageryLayer,
  JulianDate,
  Occluder,
  SceneTransforms,
  UrlTemplateImageryProvider,
  Viewer,
  WebMercatorTilingScheme,
} from "cesium";
import { useEffect, useState } from "react";

const perthLonXLatY = [115.85159, -31.952861];
const seattleLonXLatY = [-122.339529, 47.61566];
const perthFly = Cartesian3.fromDegrees(
  perthLonXLatY[0],
  perthLonXLatY[1],
  7000000
);
const seattleFly = Cartesian3.fromDegrees(
  seattleLonXLatY[0],
  seattleLonXLatY[1],
  7000000
);
const perthPos = Cartesian3.fromDegrees(perthLonXLatY[0], perthLonXLatY[1]);
const seattlePos = Cartesian3.fromDegrees(
  seattleLonXLatY[0],
  seattleLonXLatY[1]
);

type PlaceCommon = {
  name: string;
  latY: number;
  lonX: number;
  coord: Cartesian3;
  entity: Entity;
  visible: boolean;
};
type Place =
  | (PlaceCommon & {
      scrX: number;
      scrY: number;
      visible: true;
    })
  | (PlaceCommon & {
      visible: false;
    });

const CesiumApp = (props: { mapUrl: string }) => {
  const [viewer, setViewer] = useState<Viewer>();

  const ptMarker = {
    color: Color.WHITE,
    pixelSize: 8,
  };
  const [billboards, setBillboards] = useState<Place[]>([
    {
      name: "Perth",
      visible: false,
      coord: perthPos,
      latY: perthLonXLatY[1],
      lonX: perthLonXLatY[0],
      entity: new Entity({
        position: perthPos,
        point: ptMarker,
      }),
    },
    {
      name: "Seattle",
      visible: false,
      coord: seattlePos,
      latY: seattleLonXLatY[1],
      lonX: seattleLonXLatY[0],
      entity: new Entity({
        position: seattlePos,
        point: ptMarker,
      }),
    },
  ]);

  // This ImageryProvider is the glue between CesiumJS and Amazon Location Service
  const tms = new UrlTemplateImageryProvider({
    url: props.mapUrl,
    tilingScheme: new WebMercatorTilingScheme({
      numberOfLevelZeroTilesX: 1,
      numberOfLevelZeroTilesY: 1,
    }),
    maximumLevel: 17,
  });

  useEffect(() => {
    const v = new Viewer("cviewer", {
      shadows: false,
      baseLayerPicker: false,
      timeline: false,
      animation: false,
      homeButton: false,
      navigationHelpButton: false,
      sceneModePicker: false,
      selectionIndicator: false,
      fullscreenButton: false,
      infoBox: false,
      geocoder: false,
      shouldAnimate: true,
      creditContainer: document.createElement("none"),
      baseLayer: new ImageryLayer(tms),
    });
    setViewer(v);

    billboards.forEach((b) => v.entities.add(b.entity));

    const p3d = new Cartesian3();
    const p2d = new Cartesian2();

    const boundingSphere = new BoundingSphere(
      Cartesian3.ZERO,
      v.scene.globe.ellipsoid.minimumRadius
    );

    const isInView = (pos: Cartesian3) => {
      const occluder = new Occluder(boundingSphere, v.camera.position);
      return occluder.isPointVisible(pos);
    };

    const now = JulianDate.now();
    v.clock.onTick.addEventListener(() => {
      setBillboards(
        billboards.map<Place>((b) => {
          if (isInView(b.coord)) {
            b.entity.position!.getValue(now, p3d);
            SceneTransforms.worldToWindowCoordinates(v.scene, p3d, p2d);
            return { ...b, visible: true, scrX: p2d.x, scrY: p2d.y };
          }
          return { ...b, visible: false };
        })
      );
    });
  }, []);

  useEffect(() => {
    const func = () => {
      if (viewer) {
        return new Promise<void>((res, _rej) => {
          viewer.camera.flyTo({
            duration: 5,
            destination: seattleFly,
            complete: () => {
              viewer.camera.flyTo({
                duration: 5,
                destination: perthFly,
                complete: () => res(),
              });
            },
          });
        });
      }
      return new Promise<void>((res) => () => res());
    };
    func();
  }, [viewer]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        id="cviewer"
        style={{
          aspectRatio: "1.77777777",
          width: "100%",
          height: "100%",
          display: "block",
          marginTop: "auto",
          marginBottom: "auto",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {billboards.map((b) =>
          b.visible ? (
            <div
              id="controlPanel"
              style={{
                position: "absolute",
                display: "block",
                top: `${b.scrY}px`,
                left: `${b.scrX}px`,
              }}
            >
              <Container
                header={
                  <Header
                    actions={<Icon name="star" size="medium" />}
                    variant="h3"
                  >
                    {b.name}
                  </Header>
                }
              >
                <p>{`Coords: ${b.latY}, ${b.lonX}`} </p>
              </Container>
            </div>
          ) : (
            <></>
          )
        )}
      </div>
    </div>
  );
};

export default CesiumApp;
