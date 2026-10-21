"""ReThink pilot scenes. Text avoids requiring a TeX distribution."""
from manim import *

BG = '#171326'
INK = '#F7F3FF'
PURPLE = '#BDA4FA'
MINT = '#88DFCB'
GOLD = '#FFD17F'

class Pilot(Scene):
    def setup(self):
        self.camera.background_color = BG
    def title(self, text, subtitle):
        heading = Text(text, font_size=36, color=INK).to_edge(UP, buff=0.4)
        sub = Text(subtitle, font_size=21, color=PURPLE).next_to(heading, DOWN, buff=0.18)
        self.add(heading, sub)
    def label(self, text):
        return Text(text, font_size=25, color=INK).to_edge(DOWN, buff=0.65)

class Distribution(Pilot):
    def construct(self):
        self.title('Sifat distributif', 'Setiap bagian mendapat pengali yang sama')
        equation = Text('3(x + 2)', font_size=40, color=PURPLE).move_to(UP*1.2)
        self.play(Write(equation), run_time=2)
        self.wait(2)
        rows = VGroup()
        for _ in range(3):
            variable = Rectangle(width=2.4, height=0.55, color=PURPLE, fill_opacity=0.2)
            variable.add(Text('x', font_size=24, color=INK))
            units = VGroup(*[Square(side_length=0.55, color=MINT, fill_opacity=0.25).add(Text('1', font_size=20, color=INK)) for _ in range(2)]).arrange(RIGHT, buff=0.12)
            rows.add(VGroup(variable, units).arrange(RIGHT, buff=0.2))
        rows.arrange(DOWN, buff=0.2).move_to(DOWN*0.25)
        caption = self.label('Tiga kelompok. Tiap kelompok berisi x dan 2.')
        self.play(LaggedStart(*[FadeIn(row, shift=RIGHT*0.2) for row in rows], lag_ratio=0.3), FadeIn(caption), run_time=3)
        self.wait(3)
        next_caption = self.label('Ada tiga bagian x dan enam satuan.')
        self.play(Transform(caption, next_caption), Indicate(VGroup(*[r[0] for r in rows]), color=PURPLE), run_time=2)
        self.wait(3)
        self.play(Indicate(VGroup(*[r[1] for r in rows]), color=MINT), run_time=2)
        self.wait(2)
        result = Text('3(x + 2) = 3x + 6', font_size=38, color=MINT).move_to(equation)
        self.play(Transform(equation, result), Transform(caption, self.label('Kalikan 3 ke x dan juga ke 2.')), run_time=2)
        self.wait(5)
        # Total: 26 seconds.

class Quadratic(Pilot):
    def construct(self):
        self.title('Menggeser grafik kuadrat', 'Bentuk puncak: y = (x - h)^2 + k')
        axes = Axes(x_range=[-3,5,1], y_range=[-1,7,1], x_length=8, y_length=3.7, tips=False, axis_config={'color':'#756C91'}).move_to(DOWN*0.1)
        graph = axes.plot(lambda x:x*x, x_range=[-2.4,2.4], color=PURPLE)
        vertex = Dot(axes.c2p(0,0), color=MINT)
        equation = Text('y = x^2', font_size=28, color=PURPLE).to_corner(UL).shift(DOWN*1.35+RIGHT*0.35)
        caption = self.label('Mulai dari parabola y = x^2, puncaknya (0, 0).')
        self.play(Create(axes), Create(graph), FadeIn(vertex), FadeIn(equation), FadeIn(caption), run_time=3)
        self.wait(3)
        right = axes.plot(lambda x:(x-2)**2, x_range=[-0.4,4.4], color=PURPLE)
        self.play(Transform(graph,right), vertex.animate.move_to(axes.c2p(2,0)), Transform(equation,Text('y = (x - 2)^2',font_size=28,color=PURPLE).move_to(equation)), Transform(caption,self.label('x - 2 menggeser grafik dua satuan ke kanan.')),run_time=3)
        self.wait(4)
        up = axes.plot(lambda x:(x-2)**2+1, x_range=[-0.3,4.3], color=MINT)
        self.play(Transform(graph,up),vertex.animate.move_to(axes.c2p(2,1)),Transform(equation,Text('y = (x - 2)^2 + 1',font_size=28,color=MINT).move_to(equation)),Transform(caption,self.label('+1 menaikkan setiap titik satu satuan.')),run_time=3)
        self.wait(4)
        self.play(Indicate(vertex,color=GOLD),Transform(caption,self.label('Puncak sekarang (2, 1). Bentuk parabola tetap.')),run_time=2)
        self.wait(5)
        # Total: 27 seconds.

class Tangent(Pilot):
    def construct(self):
        self.title('Turunan sebagai gradien garis singgung', 'Dari perubahan rata-rata ke perubahan sesaat')
        axes = Axes(x_range=[0,3.5,1],y_range=[0,9,2],x_length=7.5,y_length=3.5,tips=False,axis_config={'color':'#756C91'}).move_to(DOWN*0.2)
        graph = axes.plot(lambda x:x*x,x_range=[0,3],color=PURPLE)
        h = ValueTracker(1.5)
        p = Dot(axes.c2p(1,1),color=MINT)
        q = always_redraw(lambda:Dot(axes.c2p(1+h.get_value(),(1+h.get_value())**2),color=GOLD))
        secant = always_redraw(lambda:Line(axes.c2p(0.65,1+(2+h.get_value())*(-0.35)),axes.c2p(2.6,1+(2+h.get_value())*1.6),color=GOLD))
        formula = Text('f(x) = x^2     |     x = 1',font_size=27,color=PURPLE).move_to(UP*1.55)
        caption = self.label('Dua titik pada kurva menentukan garis sekan.')
        self.play(Create(axes),Create(graph),FadeIn(formula),FadeIn(p),FadeIn(q),Create(secant),FadeIn(caption),run_time=3)
        self.wait(3)
        self.play(Transform(caption,self.label('Dekatkan titik kedua ke titik pertama.')),h.animate.set_value(0.5),run_time=4)
        self.wait(2)
        self.play(h.animate.set_value(0.05),Transform(caption,self.label('Gradien sekan mendekati gradien garis singgung.')),run_time=4)
        self.wait(3)
        tangent = Line(axes.c2p(0.65,0.3),axes.c2p(2.6,4.2),color=MINT)
        self.play(FadeOut(secant),FadeOut(q),Create(tangent),Transform(formula,Text("f'(x) = 2x     |     f'(1) = 2",font_size=27,color=MINT).move_to(formula)),Transform(caption,self.label('Pada x = 1, gradien garis singgung adalah 2.')),run_time=3)
        self.wait(7)
        # Total: 29 seconds.
