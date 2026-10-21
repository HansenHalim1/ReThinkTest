"""Render original topic-specific mathematical diagrams from the shared scene model."""
import json
import os
from pathlib import Path
from manim import *

PAPER='#fffdf6'
INK='#172b66'
BLUE='#2849ad'
class LessonFilm(Scene):
    def construct(self):
        self.camera.background_color=PAPER
        root=Path(__file__).resolve().parent
        frame_data=json.loads((root/'generated/teaching-frames.json').read_text())
        topic=os.environ['RETHINK_FILM_TOPIC']
        story=next(s for s in frame_data['frames'] if s['topicId']==topic)
        def label(value,size,color=INK,max_width=12.5):
            item=Text(value,font='DejaVu Sans',font_size=size,color=color)
            if item.width>max_width:item.scale_to_fit_width(max_width)
            return item
        self.add(label('ReThink  /  IDE MATEMATIKA',15,BLUE).to_corner(UL,buff=.22))
        title=label(story['title'],32).move_to(UP*3.04)
        self.add(title)
        def diagram(scene):
            group=VGroup()
            scale=11.6/640
            def pt(x,y):return [(x-320)*scale,(120-y)*scale+.15,0]
            for s in scene['shapes']:
                color=s['color'];kind=s['kind']
                if kind=='text':
                    item=label(s['text'],s.get('size',19)*.72,color,max_width=11.4)
                    # SVG baseline is below the text center.
                    item.move_to(pt(s['x'],s['y']-s.get('size',19)*.32))
                elif kind=='line':
                    a,b=s['points'];factory=DashedLine if s.get('dashed') else Line
                    if a==b:continue
                    item=factory(pt(*a),pt(*b),color=color,stroke_width=2)
                elif kind in ('polyline','polygon'):
                    points=[pt(*p) for p in s['points']]
                    item=VMobject(color=color,stroke_width=2)
                    item.set_points_as_corners(points+([points[0]] if kind=='polygon' else []))
                    if s.get('fill'):item.set_fill(s['fill'],opacity=1)
                elif kind=='circle':
                    item=Circle(radius=s['r']*scale,color=color,stroke_width=2).move_to(pt(s['x'],s['y']))
                    if s.get('fill'):item.set_fill(s['fill'],opacity=1)
                elif kind=='rect':
                    if s['w']<=0 or s['h']<=0:continue
                    item=Rectangle(width=s['w']*scale,height=s['h']*scale,color=color,stroke_width=2).move_to(pt(s['x']+s['w']/2,s['y']+s['h']/2))
                    if s.get('fill'):item.set_fill(s['fill'],opacity=1)
                else:raise ValueError(kind)
                group.add(item)
            return group
        previous=None
        for i,scene in enumerate(story['scenes']):
            art=diagram(scene)
            result=label(scene['result'],25,BLUE).move_to(DOWN*2.55)
            step=label(f'LANGKAH {i+1} / 4',15,BLUE).to_corner(UR,buff=.22)
            body=VGroup(art,result,step)
            animations=[FadeIn(body,shift=UP*.05)]
            if previous is not None:animations.insert(0,FadeOut(previous))
            self.play(*animations,run_time=.8)
            self.wait(8.2)
            previous=body
